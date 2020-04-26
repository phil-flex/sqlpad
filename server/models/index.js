const _ = require('lodash');
const Users = require('./users');
const SchemaInfo = require('./schema-info');
const ResultCache = require('./result-cache');
const QueryHistory = require('./query-history');
const Queries = require('./queries');
const Connections = require('./connections');
const ConnectionAccesses = require('./connection-accesses');
const ConnectionClients = require('./connection-clients');
const QueryAcl = require('./query-acl');
const ServiceTokens = require('./service-tokens');
const decorateQueryUserAccess = require('../lib/decorate-query-user-access');

class Models {
  constructor(sequelizeDb, config) {
    this.users = new Users(sequelizeDb, config);
    this.schemaInfo = new SchemaInfo(sequelizeDb, config);
    this.resultCache = new ResultCache(sequelizeDb, config);
    this.queryHistory = new QueryHistory(sequelizeDb, config);
    this.queries = new Queries(sequelizeDb, config);
    this.connections = new Connections(sequelizeDb, config);
    this.connectionAccesses = new ConnectionAccesses(sequelizeDb, config);
    this.connectionClients = new ConnectionClients(sequelizeDb, config);
    this.queryAcl = new QueryAcl(sequelizeDb, config);
    this.serviceTokens = new ServiceTokens(sequelizeDb, config);
  }

  /**
   * Find all queries that a user has access to.
   * This DOES NOT send associated query info at this time (acl and user object)
   * If user is an admin, get all queries
   * If user is NOT an admin, get queries created by user or that are shared
   *
   * This needs to merge queries and acl
   * Fetching both query and acl data is not ideal, but is probably okay for now
   * This will become problematic for large SQLPad environments
   * Eventually this can be a better SQL query once all data is moved to SQLite
   * @param {object} user
   */
  async findQueriesForUser(user) {
    const queries = await this.queries.findAll();
    const queryAcls = await this.queryAcl.findAll();
    const queryAclsByQueryId = _.groupBy(queryAcls, 'queryId');

    return (
      queries
        // Join in query ACL info needed for decorateQueryUserAccess
        .map(query => {
          query.acl = queryAclsByQueryId[query.id] || [];
          return query;
        })
        // Decorate query with canRead/canWrite/canDelete
        .map(query => decorateQueryUserAccess(query, user))
        // Only include queries user can read
        .filter(query => query.canRead)
    );
  }

  /**
   * Finds query and adds query.acl property
   * @param {string} id - query id
   */
  async findQueryById(id) {
    const query = await this.queries.findOneById(id);
    query.acl = await this.queryAcl.findAllByQueryId(id);
    query.acl = query.acl.map(acl => acl.toJSON());
    return query;
  }

  /**
   * Create or Update query
   * Remove existing query acl entries and add new ones if they should be added
   * TODO should probably validate userIds are valid
   * TODO should email be allowed here and be translated to userIds?
   * TODO add transaction support here once all models are in SQLite (this is risky otherwise)
   * @param {*} data
   */
  async upsertQuery(data) {
    const { acl, ...query } = data;
    let newOrUpdatedQuery;

    let exists = false;
    if (query.id) {
      const found = await this.queries.findOneById(query.id);
      exists = Boolean(found);
    }

    if (exists) {
      newOrUpdatedQuery = await this.queries.update(query.id, query);
    } else {
      newOrUpdatedQuery = await this.queries.create(query);
    }

    const queryId = newOrUpdatedQuery.id;

    await this.queryAcl.removeByQueryId(queryId);

    if (acl && acl.length) {
      const aclRows = acl.map(row => {
        return {
          queryId,
          userId: row.userId,
          userEmail: row.userEmail,
          groupId: row.groupId,
          write: row.write
        };
      });
      await this.queryAcl.bulkCreate(aclRows);
    }

    return this.findQueryById(queryId);
  }
}

module.exports = Models;
