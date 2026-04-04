'use strict';

const followService = require('../services/followService');

const follow = async (req, res) => {
    const followerAuthUid = req.user.uid;
    const { followedUserId } = req.body;
    if (!followedUserId) return res.status(400).json({ error: 'followedUserId is required.' });
    const result = await followService.followUser(followerAuthUid, followedUserId);
    res.json(result);
};

const unfollow = async (req, res) => {
    const followerAuthUid = req.user.uid;
    const { followedUserId } = req.body;
    if (!followedUserId) return res.status(400).json({ error: 'followedUserId is required.' });
    const result = await followService.unfollowUser(followerAuthUid, followedUserId);
    res.json(result);
};

const followStatus = async (req, res) => {
    const followerAuthUid = req.user.uid;
    const { targetUserId } = req.params;
    const result = await followService.checkFollowStatus(followerAuthUid, targetUserId);
    res.json(result);
};

const getFollowers = async (req, res) => {
    const { userId } = req.params;
    const result = await followService.getFollowers(userId);
    res.json(result);
};

const getFollowing = async (req, res) => {
    const { userId } = req.params;
    const result = await followService.getFollowing(userId);
    res.json(result);
};

const getSuggestedUsers = async (req, res) => {
    const authUid = req.user?.uid || null;
    const { limit } = req.query;
    const result = await followService.getSuggestedUsers(authUid, limit);
    res.json(result);
};

const getFollowingFeed = async (req, res) => {
    const authUid = req.user.uid;
    const { cursor, limit } = req.query;
    const result = await followService.getFollowingFeed(authUid, cursor, limit);
    res.json(result);
};

const getPublicProfile = async (req, res) => {
    const { userId } = req.params;
    const result = await followService.getPublicProfile(userId);
    res.json(result);
};

const searchUsers = async (req, res) => {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 1) return res.json([]);
    const result = await followService.searchUsers(q.trim(), limit);
    res.json(result);
};

module.exports = {
    follow,
    unfollow,
    followStatus,
    getFollowers,
    getFollowing,
    getSuggestedUsers,
    getFollowingFeed,
    getPublicProfile,
    searchUsers,
};
