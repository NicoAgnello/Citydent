const Category = require('../models/category');
const mongoose = require('mongoose');

const getAllCategories = async () => {
  return await Category.find().sort({ name: 1 });
};

const createCategory = async ({ name, description }) => {
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    const error = new Error('Ya existe una categoría con ese nombre.');
    error.status = 400;
    throw error;
  }

  const category = new Category({ name: name.trim(), description: description?.trim() || '' });
  return await category.save();
};

const deleteCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const deleted = await Category.findByIdAndDelete(categoryId);
  if (!deleted) {
    const error = new Error('Categoría no encontrada.');
    error.status = 404;
    throw error;
  }

  return deleted;
};

module.exports = { getAllCategories, createCategory, deleteCategory };