/** User class for message.ly */
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const res = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at) 
      VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`, [username, hashPW, first_name, last_name, phone]);

    return res.rows[0];
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const res = await db.query(`
    SELECT password FROM users WHERE username = $1
    `, [username]);
    
    if(!res.rows[0]){
      throw new ExpressError(`Invalid login`, 400)
    }
    
    const userInfo = res.rows[0];

    
    const isAuthUser = await bcrypt.compare(password, userInfo.password);
    return isAuthUser;
    
    //why do i have do it like this when not throwing an error??

    // says it can't read userInfo.password, which i get...but why does this HAVE TO return userInfo AND await with await not being allowed in another assigned to a variable.
    // console.log(await bcrypt.compare(password, userInfo.password))
    // --> return userInfo && await bcrypt.compare(password, userInfo.password);
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const res = await db.query(`
    UPDATE users
    SET last_login_at = current_timestamp
    WHERE username = $1
    RETURNING username
    `, [username]);
    if(!res.rows[0]){
      throw new ExpressError(`No user found with username: ${username}`, 404)
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const res = await db.query(`
    SELECT username, first_name, last_name, phone FROM users ORDER BY username
    `);

    return res.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const res = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1
    `, [username]);

    if(!res.rows[0]){
      throw new ExpressError(`No user found with username: ${username}`, 404);
    }

    return res.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const res = await db.query(`
    SELECT m.id,
    m.to_username,
    u.first_name,
    u.last_name,
    u.phone,
    m.body,
    m.sent_at,
    m.read_at
    FROM messages AS m
    JOIN users AS u ON m.to_username = u.username
    WHERE from_username = $1
    `, [username]);

    return res.rows.map(msg => ({
      id: msg.id,
      to_user: {
        username: msg.to_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }));
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const res = await db.query(`
    SELECT m.id,
    m.from_username,
    u.first_name,
    u.last_name,
    u.phone,
    m.body,
    m.sent_at,
    m.read_at
    FROM messages AS m
    JOIN users AS u ON m.from_username = u.username
    WHERE to_username = $1
    `, [username]);

    return res.rows.map(msg => ({
      id: msg.id,
      from_user: {
        username: msg.from_username,
        first_name: msg.first_name,
        last_name: msg.last_name,
        phone: msg.phone
      },
      body: msg.body,
      sent_at: msg.sent_at,
      read_at: msg.read_at
    }));
  }
}


module.exports = User;