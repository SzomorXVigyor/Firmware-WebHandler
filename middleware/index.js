const express = require('express');
const config = require('../config/config');

module.exports = (app) => {
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Static file serving
    app.use(express.static('public'));
    app.use('/downloads', express.static(config.UPLOAD_DIR));
};