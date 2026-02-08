import React from 'react';

const Card = ({ children, className = '', as: Comp = 'div', ...rest }) => {
  return (
    <Comp className={`ui-card ${className}`.trim()} {...rest}>
      {children}
    </Comp>
  );
};

export default Card;
