DELIMITER $$
DROP TRIGGER IF EXISTS mysql_source.set_defaults_on_insert_data_type_db_casting_master;
CREATE TRIGGER mysql_source.set_defaults_on_insert_data_type_db_casting_master
BEFORE INSERT ON mysql_source.data_type_db_casting_master
FOR EACH ROW
BEGIN
    -- Set action to 'i' if it's not provided
    IF NEW.action IS NULL OR NEW.action = '' THEN
        SET NEW.action = 'i';
    END IF;

    -- Set creation_date to today's date if it's not provided
    IF NEW.creation_date IS NULL THEN
        SET NEW.creation_date = CURDATE();
    END IF;

    -- Set version to 1 if it's not provided
    IF NEW.version IS NULL THEN
        SET NEW.version = 1;
    END IF;
    
     -- Set version to 1 if it's not provided
    IF NEW.is_active IS NULL THEN
        SET NEW.is_active = 1;
    END IF;
END$$

DELIMITER ;