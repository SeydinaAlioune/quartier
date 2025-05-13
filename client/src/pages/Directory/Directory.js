import React, { useState } from 'react';
import './Directory.css';

const Directory = () => {
  const [localBusinesses] = useState([
    {
      id: 1,
      name: 'Boulangerie "Au Pain Doré"',
      address: '45 rue des Lilas',
      phone: '01 XX XX XX XX',
      description: 'Boulangerie artisanale proposant pain traditionnel, viennoiseries et pâtisseries faites maison. Spécialités: pain aux céréales et tarte aux pommes.',
      category: 'commerce'
    },
    {
      id: 2,
      name: 'Épicerie "Le Panier Frais"',
      address: '12 rue des Tilleuls',
      phone: '01 XX XX XX XX',
      description: 'Épicerie de quartier proposant des produits frais, locaux et bio. Livraison à domicile pour personnes à mobilité réduite.',
      category: 'commerce'
    },
    {
      id: 3,
      name: 'Librairie "Mot à Mot"',
      address: '78 avenue Principale',
      phone: '01 XX XX XX XX',
      description: 'Librairie indépendante avec un large choix de romans, essais et livres pour enfants. Organisation régulière de séances de dédicaces et club de lecture.',
      category: 'commerce'
    },
    {
      id: 4,
      name: 'Café "L\'Instant"',
      address: '23 place du Marché',
      phone: '01 XX XX XX XX',
      description: 'Café convivial proposant petits déjeuners, déjeuners et pâtisseries maison. Wifi gratuit et espace de coworking à l\'étage.',
      category: 'commerce'
    },
    {
      id: 5,
      name: 'Fleuriste "Pétales & Compagnie"',
      address: '55 rue des Jardins',
      phone: '01 XX XX XX XX',
      description: 'Création de bouquets et compositions florales pour toutes occasions. Service de livraison dans tout le quartier.',
      category: 'commerce'
    },
    {
      id: 6,
      name: 'Coiffeur "Style & Vous"',
      address: '34 avenue Principale',
      phone: '01 XX XX XX XX',
      description: 'Salon de coiffure pour hommes, femmes et enfants. Spécialiste des colorations naturelles et coupes tendance.',
      category: 'commerce'
    }
  ]);

  const [healthServices] = useState([
    {
      id: 7,
      name: 'Dr. Martin - Médecin généraliste',
      address: '15 rue de la Santé',
      phone: '01 XX XX XX XX',
      description: 'Consultation sur rendez-vous du lundi au vendredi. Visite à domicile possible. Conventionné secteur 1.',
      category: 'sante'
    },
    {
      id: 8,
      name: 'Pharmacie du Quartier',
      address: '18 rue de la Santé',
      phone: '01 XX XX XX XX',
      description: 'Ouverte 7j/7 de 8h à 20h. Service de garde. Livraison à domicile pour personnes à mobilité réduite.',
      category: 'sante'
    },
    {
      id: 9,
      name: 'Cabinet dentaire des Dr. Legrand et Petit',
      address: '42 avenue Principale',
      phone: '01 XX XX XX XX',
      description: 'Soins dentaires, orthodontie, implantologie. Prise en charge des urgences. Sur rendez-vous.',
      category: 'sante'
    },
    {
      id: 10,
      name: 'Cabinet de kinésithérapie',
      address: '15 rue de la Santé',
      phone: '01 XX XX XX XX',
      description: 'Rééducation fonctionnelle, drainage lymphatique, massages thérapeutiques. À domicile ou au cabinet sur rendez-vous.',
      category: 'sante'
    }
  ]);

  const [usefulContacts] = useState({
    urgences: {
      title: 'Urgences',
      contacts: [
        { name: 'SAMU', number: '15' },
        { name: 'Police', number: '17' },
        { name: 'Pompiers', number: '18' },
        { name: 'Numéro d\'urgence européen', number: '112' },
        { name: 'Centre antipoison', number: '01 XX XX XX XX' }
      ]
    },
    services: {
      title: 'Services publics',
      contacts: [
        { name: 'Mairie de quartier', number: '01 XX XX XX XX' },
        { name: 'La Poste', number: '36 31' },
        { name: 'Centre des impôts', number: '01 XX XX XX XX' },
        { name: 'EDF (dépannage)', number: '09 XX XX XX XX' },
        { name: 'Service des eaux', number: '09 XX XX XX XX' }
      ]
    },
    associations: {
      title: 'Associations',
      contacts: [
        { name: 'Association des commerçants', number: '01 XX XX XX XX' },
        { name: 'Club sportif', number: '01 XX XX XX XX' },
        { name: 'Maison des jeunes', number: '01 XX XX XX XX' },
        { name: 'Association d\'aide aux seniors', number: '01 XX XX XX XX' },
        { name: 'Collectif environnemental', number: '01 XX XX XX XX' }
      ]
    }
  });

  // eslint-disable-next-line no-unused-vars
  const [activeCategory, setActiveCategory] = useState('all');
  
  // eslint-disable-next-line no-unused-vars
  const filterBusinesses = (category) => {
    setActiveCategory(category);
  };

  return (
    <div className="directory-container">
      <header className="directory-header">
        <h1>Annuaire Local</h1>
        <p>Découvrez les commerces, services et professionnels de votre quartier</p>
      </header>

      <section className="local-businesses">
        <h2>Commerçants Locaux</h2>
        <div className="business-grid">
          {localBusinesses.map(business => (
            <div key={business.id} className="business-card">
              <h3>{business.name}</h3>
              <p className="address"> {business.address}</p>
              <p className="phone"> {business.phone}</p>
              <p className="description">{business.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="health-services">
        <h2>Services de Santé</h2>
        <div className="business-grid">
          {healthServices.map(service => (
            <div key={service.id} className="business-card">
              <h3>{service.name}</h3>
              <p className="address"> {service.address}</p>
              <p className="phone"> {service.phone}</p>
              <p className="description">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="useful-contacts">
        <h2>Contacts Utiles</h2>
        <div className="contacts-grid">
          <div className="contact-category">
            <h3>{usefulContacts.urgences.title}</h3>
            <ul>
              {usefulContacts.urgences.contacts.map((contact, index) => (
                <li key={index}>
                  <span className="contact-name">{contact.name}:</span>
                  <span className="contact-number">{contact.number}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="contact-category">
            <h3>{usefulContacts.services.title}</h3>
            <ul>
              {usefulContacts.services.contacts.map((contact, index) => (
                <li key={index}>
                  <span className="contact-name">{contact.name}:</span>
                  <span className="contact-number">{contact.number}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="contact-category">
            <h3>{usefulContacts.associations.title}</h3>
            <ul>
              {usefulContacts.associations.contacts.map((contact, index) => (
                <li key={index}>
                  <span className="contact-name">{contact.name}:</span>
                  <span className="contact-number">{contact.number}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Directory;
