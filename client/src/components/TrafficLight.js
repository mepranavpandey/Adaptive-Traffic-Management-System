import React from 'react';
import './TrafficLight.css';

function TrafficLight({ signal }) {
  return (
    <div className="traffic-light-housing">
      <div className={`lamp red-lamp ${signal === 'red' ? 'active' : ''}`} />
      <div className={`lamp yellow-lamp ${signal === 'yellow' ? 'active' : ''}`} />
      <div className={`lamp green-lamp ${signal === 'green' ? 'active' : ''}`} />
    </div>
  );
}

export default TrafficLight;