const ErrorResp = require('../utils/ErrorResp');

module.exports = async function tokenValidator(req, res, next) {
  try {
    const [none, api, path, ...rest] = req.originalUrl.split('/');
    if (api === 'healthcheck') return next();

    let token = req.headers['authorization'];
    if (!token) {
      throw new ErrorResp('', 'Token is missing', 401);
    }
    // token = token.split(' ');
    // if (!token[1] || token[1] != ZENDESK_BASIC_AUTH)
    //   throw new ErrorResp('Invalid Token', 'Token does not exist', 401);

    // const tokenBase = Buffer.from(token[1], 'base64').toString('ascii');
    // const username = tokenBase.split(':')[0];


    // if (!username) {
    //   const userDetail = await userService.getUserByEmail(username);
    //   if (userDetail) {
    //     let { roleId, email, userId, zendeskUserId } = userDetail;

    //     await redis._hmset(
    //       email,
    //       'userId',
    //       userId,
    //       'zendeskUserId',
    //       zendeskUserId,
    //       'roleId',
    //       roleId
    //     );
    //   }
    // }


    // req.user = {
    //   email: username,
    //   roleId,
    //   userId,
    //   zendeskUserId,
    // };

    return next();
  } catch (err) {
    next(err);
  }
};
