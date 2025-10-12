import React from 'react';

const QuantityInput = ({ value, onChange, min = 1, max = 99 }) => {
  const handleChange = (event) => {
    const parsed = Number(event.target.value);
    if (Number.isNaN(parsed)) {
      return;
    }
    if (parsed < min || parsed > max) {
      return;
    }
    onChange(parsed);
  };

  const handleStep = (delta) => {
    const next = value + delta;
    if (next >= min && next <= max) {
      onChange(next);
    }
  };

  return (
    <div className="quantity-input">
      <button type="button" onClick={() => handleStep(-1)} aria-label="Decrease quantity">
        −
      </button>
      <input type="number" min={min} max={max} value={value} onChange={handleChange} />
      <button type="button" onClick={() => handleStep(1)} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
};

export default QuantityInput;
