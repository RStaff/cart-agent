import { getOrCreateUser } from "../auth/getUser.js";
export async function attachUser(req, _res, next) {
  req.user = await getOrCreateUser(req);
  next();
}
