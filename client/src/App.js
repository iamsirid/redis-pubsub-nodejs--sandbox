import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [val, setVal] = useState('');
  useEffect(() => {
    axios.get('http://localhost:5000/val').then(res => {
      setVal(res.data);
    });
  }, [setVal]);
  return (
    <div className="App">
      {JSON.stringify(val)}

      <div className="">
        <button onClick={() => axios.post('http://localhost:5000/val')}>
          POST
        </button>
      </div>
    </div>
  );
}

export default App;
