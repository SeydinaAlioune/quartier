import React, { useState } from 'react';
import './Security.css';
import ReportIncident from './ReportIncident';

const Security = () => {
  const [alerts] = useState([
    {
      id: 1,
      type: 'cambriolage',
      date: '18/11/2023',
      message: 'Plusieurs cambriolages ont été signalés dans le secteur nord du quartier cette semaine. Redoublez de vigilance et vérifiez la fermeture de vos portes et fenêtres.',
      severity: 'high'
    },
    {
      id: 2,
      type: 'circulation',
      date: '20/11/2023',
      message: 'En raison des travaux rue des Tilleuls, la circulation est difficile. Prévoir un itinéraire alternatif jusqu\'au 25 novembre.',
      severity: 'medium'
    }
  ]);

  const [policeInfo] = useState({
    message: 'Des patrouilles de police supplémentaires sont prévues dans le quartier les soirs de ce week-end suite aux récents incidents.',
    contact: 'Lieutenant Garcia - Contact: 01 XX XX XX XX'
  });

  const [securityTips] = useState({
    domicile: {
      title: 'Protection du Domicile',
      tips: [
        'Fermez toujours vos portes à clé, même lorsque vous êtes chez vous',
        'Installez des serrures de qualité et un judas sur votre porte d\'entrée',
        'Évitez de cacher vos clés à l\'extérieur de votre domicile',
        'Installez un éclairage extérieur avec détecteur de mouvement',
        'Ne laissez pas d\'objets de valeur visibles depuis les fenêtres'
      ]
    },
    deplacement: {
      title: 'Sécurité en Déplacement',
      tips: [
        'Restez vigilant et attentif à votre environnement',
        'Évitez de marcher seul la nuit dans des zones peu fréquentées',
        'Tenez votre téléphone et objets de valeur hors de vue',
        'Informez un proche de vos déplacements tardifs',
        'Utilisez l\'application "Rentrer en sécurité" pour le suivi de trajet'
      ]
    },
    arnaques: {
      title: 'Protection contre les Arnaques',
      tips: [
        'Ne communiquez jamais vos coordonnées bancaires par téléphone',
        'Méfiez-vous des démarcheurs non sollicités à domicile',
        'Vérifiez l\'identité des personnes qui se présentent (badge, carte professionnelle)',
        'Ne cliquez pas sur des liens suspects dans vos emails',
        'Signalez toute tentative d\'arnaque sur la plateforme nationale'
      ]
    }
  });

  const [showReportForm, setShowReportForm] = useState(false);

  const handleReportClick = () => {
    setShowReportForm(true);
  };

  const handleCloseReport = () => {
    setShowReportForm(false);
  };

  return (
    <div className="security-container">
      <header className="security-header">
        <h1>Sécurité du Quartier</h1>
        <p>Ensemble, veillons à la tranquillité et à la sécurité de notre communauté</p>
      </header>

      <section className="report-incident">
        <h2>Signaler un Incident</h2>
        <button className="report-button" onClick={handleReportClick}>
          <i className="fas fa-exclamation-triangle"></i> Signaler un incident
        </button>
        {showReportForm && <ReportIncident onClose={handleCloseReport} />}
      </section>

      <section className="real-time-alerts">
        <h2>Alertes en Temps Réel</h2>
        {alerts.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              {alert.type === 'cambriolage' && <i className="fas fa-shield-alt"></i>}
              {alert.type === 'circulation' && <i className="fas fa-car"></i>}
              <h3>Alerte {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} - {alert.date}</h3>
            </div>
            <p>{alert.message}</p>
          </div>
        ))}

        <div className="police-info">
          <i className="fas fa-police-box"></i>
          <h3>Patrouilles de Police</h3>
          <p>{policeInfo.message}</p>
          <p className="contact-info">{policeInfo.contact}</p>
        </div>
      </section>

      <section className="security-tips">
        <h2>Conseils de Sécurité</h2>
        <div className="tips-grid">
          {Object.values(securityTips).map((category, index) => (
            <div key={index} className="tip-card">
              <h3>{category.title}</h3>
              <ul>
                {category.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>
                    <i className="fas fa-check"></i>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Security;
