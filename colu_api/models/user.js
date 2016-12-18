'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM,
      values: ['none', 'admin'],
      defaultValue: 'none'
    }
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsTo(models.Community, {
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
          foreignKey: {
            name: 'communityId',
            allowNull: false
          }
        });
      }
    }
  });
  return User;
};