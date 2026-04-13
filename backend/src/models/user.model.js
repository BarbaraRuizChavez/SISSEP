/**
 * User Model
 * Acceso a datos para la tabla users
 * @module models/user.model
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

/**
 * User Model - Operaciones CRUD para usuarios
 */
const userModel = {
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async create(userData) {
    const {
      controlNumber,
      passwordHash,
      name,
      email,
      role,
      career,
      phone
    } = userData;

    const query = `
      INSERT INTO users (control_number, password_hash, name, email, role, career, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, control_number, name, email, role, career, phone, is_active, created_at
    `;

    const values = [controlNumber, passwordHash, name, email, role, career || null, phone || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Buscar usuario por ID
   * @param {string} id - UUID del usuario
   * @param {Object} options - Opciones (includePassword)
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async findById(id, options = {}) {
    const selectFields = options.includePassword
      ? '*'
      : 'id, control_number, name, email, role, career, phone, is_active, created_at, updated_at, last_login';

    const query = `SELECT ${selectFields} FROM users WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Buscar usuario por número de control
   * @param {string} controlNumber - Número de control
   * @param {Object} options - Opciones (includePassword)
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async findByControlNumber(controlNumber, options = {}) {
    const selectFields = options.includePassword
      ? '*'
      : 'id, control_number, name, email, role, career, phone, is_active, created_at, updated_at, last_login';

    const query = `SELECT ${selectFields} FROM users WHERE control_number = $1`;
    const result = await pool.query(query, [controlNumber]);
    return result.rows[0] || null;
  },

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  async findByEmail(email) {
    const query = `
      SELECT id, control_number, name, email, role, career, phone, is_active, created_at
      FROM users WHERE email = $1
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  /**
   * Listar usuarios con filtros y paginación
   * @param {Object} filters - Filtros (role, search, isActive)
   * @returns {Promise<Array>} Lista de usuarios
   */
  async findMany(filters = {}) {
    const { page = 1, perPage = 20, role, search, isActive } = filters;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      values.push(role);
    }

    if (isActive !== undefined) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      values.push(isActive);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR control_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    const query = `
      SELECT id, control_number, name, email, role, career, phone, is_active, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(perPage, (page - 1) * perPage);

    const result = await pool.query(query, values);
    return result.rows;
  },

  /**
   * Contar usuarios según filtros
   * @param {Object} filters - Filtros
   * @returns {Promise<number>} Cantidad de usuarios
   */
  async count(filters = {}) {
    const { role, isActive } = filters;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      values.push(role);
    }

    if (isActive !== undefined) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      values.push(isActive);
    }

    const query = `SELECT COUNT(*) FROM users ${whereClause}`;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  },

  /**
   * Actualizar usuario
   * @param {string} id - UUID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async update(id, updateData) {
    const allowedFields = ['name', 'email', 'career', 'phone', 'is_active', 'password_hash'];
    const updates = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, control_number, name, email, role, career, phone, is_active, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  /**
   * Actualizar último login
   * @param {string} id - UUID del usuario
   * @returns {Promise<void>}
   */
  async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  },

  /**
   * Eliminar usuario (hard delete)
   * @param {string} id - UUID del usuario
   * @returns {Promise<void>}
   */
  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
  },

  /**
   * Verificar si existe el número de control
   * @param {string} controlNumber - Número de control
   * @returns {Promise<boolean>}
   */
  async existsControlNumber(controlNumber) {
    const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE control_number = $1)';
    const result = await pool.query(query, [controlNumber]);
    return result.rows[0].exists;
  },

  /**
   * Verificar si existe el email
   * @param {string} email - Email
   * @returns {Promise<boolean>}
   */
  async existsEmail(email) {
    const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)';
    const result = await pool.query(query, [email]);
    return result.rows[0].exists;
  }
};

module.exports = userModel;
