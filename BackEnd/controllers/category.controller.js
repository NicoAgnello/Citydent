const { getAllCategories, createCategory, updateCategory, toggleCategory } = require('../services/category.service');

const getAll = async (req, res) => {
  try {
    const filter = (req.filter && typeof req.filter === 'object') ? req.filter : {};
    const categories = await getAllCategories(filter);
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error en getAll categories:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await createCategory({ name, description });
    res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const toggle = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await toggleCategory(id);
    res.status(200).json({ success: true, category });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const category = await updateCategory(id, { name, description, isActive });
    res.status(200).json({ success: true, category });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ error: error.message });
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { getAll, create, update, toggle };