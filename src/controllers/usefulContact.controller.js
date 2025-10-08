const UsefulContactCategory = require('../models/usefulContact.model');

// Get all categories with contacts (public)
exports.list = async (req, res) => {
  try {
    const cats = await UsefulContactCategory.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ categories: cats });
  } catch (err) {
    console.error('list useful contacts error:', err);
    res.status(500).json({ message: "Erreur lors du chargement des contacts utiles" });
  }
};

// Create category (admin)
exports.createCategory = async (req, res) => {
  try {
    const { title, order = 0 } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Titre requis' });
    const count = await UsefulContactCategory.countDocuments();
    const cat = await UsefulContactCategory.create({ title: title.trim(), order: order || count });
    res.status(201).json({ message: 'Catégorie créée', category: cat });
  } catch (err) {
    console.error('createUsefulContactCategory error:', err);
    res.status(500).json({ message: "Erreur lors de la création de la catégorie" });
  }
};

// Update category (admin)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;
    const cat = await UsefulContactCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    if (title !== undefined) cat.title = title.trim();
    if (order !== undefined) cat.order = order;
    await cat.save();
    res.json({ message: 'Catégorie mise à jour', category: cat });
  } catch (err) {
    console.error('updateUsefulContactCategory error:', err);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

// Delete category (admin)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await UsefulContactCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    await cat.deleteOne();
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    console.error('deleteUsefulContactCategory error:', err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

// Add contact (admin)
exports.addContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, number, note } = req.body;
    if (!name || !number) return res.status(400).json({ message: 'Nom et numéro requis' });
    const cat = await UsefulContactCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    cat.contacts.push({ name: name.trim(), number: number.trim(), note: note?.trim() });
    await cat.save();
    res.status(201).json({ message: 'Contact ajouté', category: cat });
  } catch (err) {
    console.error('addUsefulContact error:', err);
    res.status(500).json({ message: "Erreur lors de l'ajout du contact" });
  }
};

// Update contact (admin)
exports.updateContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const { name, number, note } = req.body;
    const cat = await UsefulContactCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    const c = cat.contacts.id(contactId);
    if (!c) return res.status(404).json({ message: 'Contact introuvable' });
    if (name !== undefined) c.name = name.trim();
    if (number !== undefined) c.number = number.trim();
    if (note !== undefined) c.note = note.trim();
    await cat.save();
    res.json({ message: 'Contact mis à jour', category: cat });
  } catch (err) {
    console.error('updateUsefulContact error:', err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du contact" });
  }
};

// Delete contact (admin)
exports.deleteContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const cat = await UsefulContactCategory.findById(id);
    if (!cat) return res.status(404).json({ message: 'Catégorie introuvable' });
    const c = cat.contacts.id(contactId);
    if (!c) return res.status(404).json({ message: 'Contact introuvable' });
    c.deleteOne();
    await cat.save();
    res.json({ message: 'Contact supprimé', category: cat });
  } catch (err) {
    console.error('deleteUsefulContact error:', err);
    res.status(500).json({ message: "Erreur lors de la suppression du contact" });
  }
};
