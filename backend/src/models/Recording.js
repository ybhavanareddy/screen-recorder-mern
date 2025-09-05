import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Recording = sequelize.define('Recording', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER, // bytes
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false
  }
}, {
  timestamps: true, // createdAt / updatedAt
  updatedAt: false // we don't need updatedAt for this assignment
});

export default Recording;
