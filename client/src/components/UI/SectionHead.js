import React from 'react';

const SectionHead = ({ kicker, title, lead, actions, align = 'left' }) => {
  return (
    <div className={`ui-section-head ui-section-head--${align}`.trim()}>
      {kicker ? <p className="ui-section-kicker">{kicker}</p> : null}
      {title ? <h2 className="ui-section-title">{title}</h2> : null}
      {lead ? <p className="ui-section-lead">{lead}</p> : null}
      {actions ? <div className="ui-section-actions">{actions}</div> : null}
    </div>
  );
};

export default SectionHead;
