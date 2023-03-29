const Sauces = require('../models/sauces');
const fs = require("fs");

exports.createSauces = (req, res, next) => {
  const saucesObject = JSON.parse(req.body.sauce);
  delete saucesObject._id;
  delete saucesObject._userId;
  const sauces = new Sauces({
      ...saucesObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauces.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneSauces = (req, res, next) => {
  Sauces.findOne({
    _id: req.params.id
  }).then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifySauces = (req, res, next) => {
  const saucesObject = req.file ? {
      ...JSON.parse(req.body.sauces),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete saucesObject._userId;
  Sauces.findOne({_id: req.params.id})
      .then((sauces) => {
          if (sauces.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Sauces.updateOne({ _id: req.params.id}, { ...saucesObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteSauces = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id})
      .then(sauces => {
          if (sauces.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = sauces.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Sauces.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllSauces = (req, res, next) => {
  Sauces.find().then(
    (saucess) => {
      res.status(200).json(saucess);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


exports.likeSauces = (req, res, next) => {
  const userId = req.body.userId;
  const like = req.body.like;

  if (!userId || like === undefined) {
    return res.status(400).json({ error });
  }

  Sauces.findById(req.params.id)
    .then(sauce => {
      if (!sauce) {
        return res.status(404).json({ error });
      }

      const indexLike = sauce.usersLiked.indexOf(userId);
      const indexDislike = sauce.usersDisliked.indexOf(userId);

      if (like === 1) {
        if (indexLike === -1) {
          sauce.usersLiked.push(userId);
          sauce.likes++;
        } else {
          return res.status(400).json({ error });
        }
      } else if (like === -1) {
        if (indexDislike === -1) {
          sauce.usersDisliked.push(userId);
          sauce.dislikes++;
        } else {
          return res.status(400).json({ error });
        }
      } else if (like === 0) {
        if (indexLike !== -1) {
          sauce.usersLiked.splice(indexLike, 1);
          sauce.likes--;
        } else if (indexDislike !== -1) {
          sauce.usersDisliked.splice(indexDislike, 1);
          sauce.dislikes--;
        }
      }

      sauce.save()
        .then(() => {
          res.status(200).json(sauce);
        })
        .catch(error => {
          res.status(500).json({ error });
        });
    })
    .catch(error => {
      res.status(500).json({ error });
    });
};