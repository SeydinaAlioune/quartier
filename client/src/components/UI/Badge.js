import React from 'react';

const Badge = ({
  children,
  className = '',
  tone,
  as: Comp = 'span',
  ...rest
}) => {
  const toneClass = tone ? `ui-badge--${tone}` : '';
  return (
    <Comp className={`ui-badge ${toneClass} ${className}`.trim()} {...rest}>
      {children}
    </Comp>
  );
};

export default Badge;
