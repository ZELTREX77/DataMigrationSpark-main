import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from dotenv import load_dotenv
import time
from PostgresUtilityFunction import execute_query

def initialize_spark():
    """Initialize Spark session with required configurations"""
    return SparkSession.builder \
        .appName("Data Migration") \
        .config("spark.jars", "/opt/spark/apps/jars/mysql-connector-java-8.0.30.jar,/opt/spark/apps/jars/postgresql-42.7.7.jar") \
        .getOrCreate()

def load_config():
    """Load configuration from environment variables"""
    load_dotenv()
    return {
        'source_db_name': "mysql",
        'target_db_name': "postgres",
        'postgres': {
            'host': os.getenv("POSTGRES_HOSTNAME"),
            'port': os.getenv("POSTGRES_PORT"),
            'db': os.getenv("POSTGRES_DATABASE"),
            'user': os.getenv("POSTGRES_USERNAME"),
            'password': os.getenv("POSTGRES_PASSWORD"),
            'driver': os.getenv("POSTGRES_DRIVER")
        },
        'mysql': {
            'host': os.getenv("MYSQL_HOSTNAME"),
            'port': os.getenv("MYSQL_PORT"),
            'db': os.getenv("MYSQL_DATABASE"),
            'user': os.getenv("MYSQL_USERNAME"),
            'password': os.getenv("MYSQL_PASSWORD"),
            'driver': os.getenv("MYSQL_DRIVER")
        }
    }

def get_connection_urls(config):
    """Generate connection URLs for databases"""
    mysql_conf = config['mysql']
    postgres_conf = config['postgres']
    
    return {
        'mysql_url': f"jdbc:mysql://{mysql_conf['host']}:{mysql_conf['port']}/{mysql_conf['db']}",
        'postgres_url': f"jdbc:postgresql://{postgres_conf['host']}:{postgres_conf['port']}/{postgres_conf['db']}",
        'postgres_properties': {
            "user": postgres_conf['user'],
            "password": postgres_conf['password'],
            "driver": postgres_conf['driver']
        }
    }

def get_schema_list(spark, config, urls):
    """Fetch schema list from MySQL"""
    return spark.read \
        .format("jdbc") \
        .option("url", urls['mysql_url']) \
        .option("dbtable", f"{config['mysql']['db']}.schema_master") \
        .option("user", config['mysql']['user']) \
        .option("password", config['mysql']['password']) \
        .option("driver", config['mysql']['driver']) \
        .option("fetchsize", "1000") \
        .option("numPartitions", "4") \
        .option("partitionColumn", "schema_mstr_key") \
        .option("lowerBound", "1") \
        .option("upperBound", "1000") \
        .load() \
        .select(["schema_name" , "complete_refresh"]) \
        .cache()

def get_tables_list(spark, config, urls, schema_name):
    """Fetch tables list for a given schema"""
    query = f"""SELECT tm.table_mstr_key, tm.table_name
            FROM {config['mysql']['db']}.table_master tm
            INNER JOIN {config['mysql']['db']}.schema_master sm 
            ON sm.schema_mstr_key = tm.schema_mstr_key AND sm.is_active = 1
            WHERE tm.is_active AND sm.schema_name = '{schema_name}' """
    
    return spark.read \
        .format("jdbc") \
        .option("url", urls['mysql_url']) \
        .option("query", query) \
        .option("user", config['mysql']['user']) \
        .option("password", config['mysql']['password']) \
        .option("driver", config['mysql']['driver']) \
        .load()

def filter_excluded_tables(spark, config, urls, tables_list):
    """Filter out excluded tables"""
    exclusion_df = spark.read \
        .format("jdbc") \
        .option("url", urls['mysql_url']) \
        .option("dbtable", f"{config['mysql']['db']}.exclusion_rule_master") \
        .option("user", config['mysql']['user']) \
        .option("password", config['mysql']['password']) \
        .option("driver", config['mysql']['driver']) \
        .load()
    
    return tables_list.join(
        exclusion_df,
        tables_list["table_mstr_key"] == exclusion_df["excluded_entity_mstr_key"],
        how="left_anti")

def get_table_ddl(spark, config, urls, schema_name, table_name):
    """Get table DDL for MSSQL Server"""
    source_db_name = config['source_db_name']
    target_db_name = config['target_db_name']
    mysql_db = config['mysql']['db']
    
    query = f"""WITH exclusion_entity AS (
                    SELECT temp.exclusion_rule_type_mstr_key , group_concat(temp.excluded_entity_mstr_key) as entity_mstr_key FROM (
                        SELECT  erm.exclusion_rule_type_mstr_key ,  erm.excluded_entity_mstr_key FROM {mysql_db}.exclusion_rule_master erm
                        INNER JOIN {mysql_db}.exclusion_rule_type_master ertm ON ertm.exclusion_rule_type_mstr_key = erm.exclusion_rule_type_mstr_key AND ertm.is_active = 1
                        LEFT JOIN {mysql_db}.field_master fm ON fm.field_mstr_key =  erm.excluded_entity_mstr_key AND fm.is_active = 1
                        WHERE erm.is_active = 1
                        UNION
                        SELECT  erm.exclusion_rule_type_mstr_key ,  erm.excluded_entity_mstr_key FROM {mysql_db}.exclusion_rule_master erm
                        INNER JOIN {mysql_db}.exclusion_rule_type_master ertm ON ertm.exclusion_rule_type_mstr_key = erm.exclusion_rule_type_mstr_key AND ertm.is_active = 1
                        LEFT JOIN {mysql_db}.data_type_master dtm ON dtm.data_type_mstr_key =  erm.excluded_entity_mstr_key AND dtm.is_active = 1
                        WHERE erm.is_active = 1)temp
                        GROUP BY temp.exclusion_rule_type_mstr_key)
                    SELECT  GROUP_CONCAT(fm.field_name) AS mysql_fields, CONCAT('CREATE TABLE ', sm.schema_name , '.', tm.table_name ,'('
                            ,GROUP_CONCAT(CONCAT(fm.field_name,' ', IF(dtm2.data_type IS NULL ,dtm.data_type,dtm2.data_type) , IF(fm.max_length IS NOT NULL, CONCAT(' (',  fm.max_length , ') '),''))),
                            ');') as create_ddl
                    FROM {mysql_db}.db_type_master dbtm1
                    INNER JOIN {mysql_db}.schema_master sm ON sm.db_type_mstr_key = dbtm1.db_type_mstr_key AND sm.is_active = 1 
                    INNER JOIN {mysql_db}.table_master tm ON sm.schema_mstr_key = tm.schema_mstr_key AND tm.is_active = 1
                    INNER JOIN {mysql_db}.field_master fm ON fm.table_mstr_key = tm.table_mstr_key AND fm.is_active = 1
                    INNER JOIN {mysql_db}.data_type_master dtm ON dtm.data_type_mstr_key = fm.data_type_mstr_key AND dtm.is_active = 1
                    LEFT JOIN {mysql_db}.data_type_db_casting_master dtdcm1 ON dtdcm1.source_db_mstr_key = dbtm1.db_type_mstr_key AND dtdcm1.source_data_type_mstr_key = dtm.data_type_mstr_key AND dtdcm1.is_active = 1
                    LEFT JOIN {mysql_db}.data_type_master dtm2 ON dtm2.data_type_mstr_key = dtdcm1.target_data_type_mstr_key AND dtm2.is_active = 1
                    LEFT JOIN {mysql_db}.db_type_master dbtm2 ON dbtm2.db_type_mstr_key = dtdcm1.target_db_mstr_key AND dbtm2.is_active =1 AND  dbtm2.db_name = '{target_db_name}'
                    WHERE dbtm1.is_active AND sm.schema_name = '{schema_name}' AND tm.table_name = '{table_name}' AND dbtm1.db_name= '{source_db_name}' 
                    AND dtm.data_type_mstr_key NOT IN (SELECT entity_mstr_key FROM exclusion_entity WHERE exclusion_rule_type_mstr_key = 3)
                    AND dtm2.data_type_mstr_key NOT IN (SELECT entity_mstr_key FROM exclusion_entity WHERE exclusion_rule_type_mstr_key = 3)
                    AND fm.field_mstr_key NOT IN (SELECT entity_mstr_key FROM exclusion_entity WHERE exclusion_rule_type_mstr_key = 2)"""
    
    return spark.read \
        .format("jdbc") \
        .option("url", urls['mysql_url']) \
        .option("query", query) \
        .option("user", config['mysql']['user']) \
        .option("password", config['mysql']['password']) \
        .option("driver", config['mysql']['driver']) \
        .load().select(["create_ddl","mysql_fields"])

def migrate_table_data(spark, config, urls, schema_name, table_name, mysql_fields):
    """Migrate data for a single table"""
    df = spark.read \
        .format("jdbc") \
        .option("url", urls['mysql_url']) \
        .option("dbtable", f"{schema_name}.{table_name}") \
        .option("user", config['mysql']['user']) \
        .option("password", config['mysql']['password']) \
        .option("driver", config['mysql']['driver']) \
        .load().select(mysql_fields)
    
    print(f"Schema and table name : {schema_name}.{table_name}")
    df.write \
        .mode("append") \
        .jdbc(urls['postgres_url'], f"{schema_name}.{table_name}", 
              properties=urls['postgres_properties'])

def main():
    print("\nStarting the Data Migration Job...")
    start_time = time.time()
    
    # Initialize services
    spark = initialize_spark()
    config = load_config()
    urls = get_connection_urls(config)
    
    # Get schema list and process each schema
    schema_list = get_schema_list(spark, config, urls)
    
    for row in schema_list.collect():
        schema_name = row['schema_name']
        if row['complete_refresh'] == 1:
            execute_query(f"""DROP SCHEMA IF EXISTS {schema_name};""")
            print(f"Schema {schema_name} is marked for complete refresh. Dropping existing database.")
        else:
            print(f"Schema {schema_name} is not marked for complete refresh. Proceeding with migration.")
        execute_query(f"CREATE SCHEMA {schema_name};")
        
        tables_list = get_tables_list(spark, config, urls, schema_name)
        tables_list = filter_excluded_tables(spark, config, urls, tables_list)
        
        for table_row in tables_list.collect():
            table_name = table_row['table_name']
            table_ddl = get_table_ddl(spark, config, urls, schema_name, table_name)
            
            mysql_fields = table_ddl.collect()[0]["mysql_fields"].split(",")
            execute_query(table_ddl.collect()[0]["create_ddl"])
            
            migrate_table_data(spark, config, urls, schema_name, table_name, mysql_fields)
    
    duration = round((time.time() - start_time)/60, 2)
    print("=============================================")
    print(f"Job completed in {duration} minutes.")
    print("=============================================")

if __name__ == "__main__":
    main()
