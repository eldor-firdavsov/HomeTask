import React from 'react';
export default function Button({ variant = 'glass', children, onClick, style, ...props }) {
  return <button className={`btn btn-${variant}`} onClick={onClick} style={style} {...props}>{children}</button>;
}