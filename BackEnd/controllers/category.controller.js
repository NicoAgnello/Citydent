const { getAllCategories, createCategory, deleteCategory } = require('../services/category.service');

const getAll = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) {
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

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await deleteCategory(id);
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

module.exports = { getAll, create, remove };