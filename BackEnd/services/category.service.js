const Category = require('../models/category');
const mongoose = require('mongoose');

const getAllCategories = async (filter = {}) => {
  return await Category.find(filter).sort({ name: 1 });
};

const createCategory = async ({ name, description }) => {
  if (description && description.trim().length > 100) {
    const error = new Error('La descripción no puede exceder los 100 caracteres.');
    error.status = 400;
    throw error;
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    const error = new Error('Ya existe una categoría con ese nombre.');
    error.status = 400;
    throw error;
  }

  const category = new Category({ name: name.trim(), description: description?.trim() || '' });
  return await category.save();
};

const updateCategory = async (categoryId, { name, description, isActive }) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  if (description !== undefined && description.trim().length > 100) {
    const error = new Error('La descripción no puede exceder los 100 caracteres.');
    error.status = 400;
    throw error;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.status = 404;
    throw error;
  }

  if (name !== undefined) {
    const trimmed = name.trim();
    const existing = await Category.findOne({ name: trimmed, _id: { $ne: categoryId } });
    if (existing) {
      const error = new Error('Ya existe una categoría con ese nombre.');
      error.status = 400;
      throw error;
    }
    category.name = trimmed;
  }

  if (description !== undefined) category.description = description.trim();
  if (isActive !== undefined) category.isActive = isActive;

  return await category.save();
};

const toggleCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.status = 404;
    throw error;
  }

  category.isActive = !category.isActive;
  return await category.save();
};

module.exports = { getAllCategories, createCategory, updateCategory, toggleCategory };