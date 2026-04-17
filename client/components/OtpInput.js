'use client';
import { useState, useRef, useEffect } from 'react';

export default function OtpInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && index < length - 1) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, length).split('');
    if (data.some(d => isNaN(d))) return;
    
    const newOtp = [...otp];
    data.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    
    // focus last filled or next empty
    const nextIndex = Math.min(data.length, length - 1);
    inputs.current[nextIndex].focus();
  };

  useEffect(() => {
    if (otp.join('').length === length) {
      onComplete(otp.join(''));
    }
  }, [otp]);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onPaste={handlePaste}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputs.current[index] = el)}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          style={{
            width: '45px',
            height: '55px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: '2px solid var(--border)',
            background: 'var(--warm-white)',
            color: 'var(--primary)',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      ))}
    </div>
  );
}
