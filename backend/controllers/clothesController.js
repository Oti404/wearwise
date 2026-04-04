'use strict';

const clothesService = require('../services/clothesSqlService');

const getClothes = async (req, res) => {
  const { excludeUser, cursor, limit } = req.query;
  const result = await clothesService.getClothesPage({ excludeUser, cursor, limit });
  console.log(`[SQL] getClothes returned ${result.items.length} items. NextCursor: ${result.nextCursor}`);
  res.json(result);
};

const getClothesById = async (req, res) => {
  const item = await clothesService.getClothesById(req.params.id);
  res.json(item);
};

const createItem = async (req, res) => {
  // uid comes from the verified token, NOT from req.body
  const item = await clothesService.createClothesItem(req.user.uid, req.body);
  res.status(201).json(item);
};

const getUserCloset = async (req, res) => {
  const clothes = await clothesService.getUserCloset(req.params.userId);
  res.json(clothes);
};

const markAsSold = async (req, res) => {
  const item = await clothesService.markAsSold(req.params.id, req.user.uid);
  res.json(item);
};

module.exports = { getClothes, getClothesById, createItem, getUserCloset, markAsSold };
