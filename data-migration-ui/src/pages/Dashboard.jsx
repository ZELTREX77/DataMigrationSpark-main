import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

export default function Dashboard() {
  // Example data for charts
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Migrations',
        data: [12, 19, 3, 5, 2],
        fill: false,
        borderColor: '#42A5F5'
      }
    ]
  };

  const pieData = {
    labels: ['Success', 'Failed', 'Pending'],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ['#42A5F5', '#FF6384', '#FFCE56'],
        hoverBackgroundColor: ['#64B5F6', '#FF6384', '#FFCE56']
      }
    ]
  };

  return (
    <div style={{ padding: '1rem' }}>
      {/* Top row with cards */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
        <Card title="Total Migrations" subTitle="This Month" style={{ flex: 1 }}>
          <h2>120</h2>
        </Card>
        <Card title="Success" subTitle="Completed" style={{ flex: 1 }}>
          <h2>100</h2>
        </Card>
        <Card title="Failed" subTitle="Errors" style={{ flex: 1 }}>
          <h2>10</h2>
        </Card>
        <Card title="Pending" subTitle="In Progress" style={{ flex: 1 }}>
          <h2>10</h2>
        </Card>
      </div>
      {/* Second row with charts */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 2, background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h3>Migrations Over Time</h3>
          <Chart type="line" data={lineData} />
        </div>
        <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: '8px' }}>
          <h3>Status Distribution</h3>
          <Chart type="pie" data={pieData} />
        </div>
      </div>
    </div>
  );
}
