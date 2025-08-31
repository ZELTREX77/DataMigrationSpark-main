import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import DesignerCanvas from './DesignerCanvas';

export default function TransformationDesignerPage() {
  return (
    <ReactFlowProvider>
      <DesignerCanvas />
    </ReactFlowProvider>
  );
}
