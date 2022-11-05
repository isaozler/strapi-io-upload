'use strict';

const fs = require('fs');
const path = require('path');
const { PayloadTooLargeError } = require('@strapi/utils').errors;

module.exports = {
  init({ sizeLimit = 1000000 } = {}) {
    const verifySize = file => {
      if (file.size > sizeLimit) {
        throw new PayloadTooLargeError();
      }
    };

    const isProduction = strapi.config.get('server.NODE_ENV') === 'production';
    const isCdnPathAbsolute = strapi.config.get('server.isCdnPathAbsolute');
    const uploadDir = isProduction || isCdnPathAbsolute ? path.resolve(strapi.config.get('server.uploadDir')) : path.resolve(__dirname, strapi.config.get('server.uploadDir'));
    const publicPath = strapi.config.get('server.publicPath');

    return {
      upload(file) {
        verifySize(file);

        return new Promise((resolve, reject) => {
          // write file in public/assets folder
          fs.writeFile(
            path.join(uploadDir, `/${file.hash}${file.ext}`),
            file.buffer,
            err => {
              if (err) {
                return reject(err);
              }

              file.url = `${publicPath}/${file.hash}${file.ext}`;

              resolve();
            }
          );
        });
      },
      delete(file) {
        return new Promise((resolve, reject) => {
          const filePath = path.join(uploadDir, `/${file.hash}${file.ext}`);

          if (!fs.existsSync(filePath)) {
            return resolve("File doesn't exist");
          }

          // remove file from public/assets folder
          fs.unlink(filePath, err => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      },
    };
  },
};
