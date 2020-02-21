const Joi = require('@hapi/joi');

const schema = Joi.object({
  _id: Joi.string().optional(), // generated by nedb
  userId: Joi.string().required(),
  userEmail: Joi.string().required(),
  connectionId: Joi.string().required(),
  connectionName: Joi.string().required(),
  startTime: Joi.date(),
  stopTime: Joi.date(),
  queryRunTime: Joi.number().integer(),
  queryId: Joi.string().allow(''),
  queryName: Joi.string().allow(''),
  queryText: Joi.string().required(),
  rowCount: Joi.number().integer(),
  incomplete: Joi.boolean(),
  createdDate: Joi.date().default(new Date())
});

class QueryHistory {
  constructor(nedb, config) {
    this.nedb = nedb;
    this.config = config;
  }

  findOneById(id) {
    return this.nedb.queryHistory.findOne({ _id: id });
  }

  async findAll() {
    return this.nedb.queryHistory
      .cfind({}, {})
      .sort({ startTime: -1 })
      .exec();
  }

  findByFilter(filter) {
    return this.nedb.queryHistory
      .cfind(filter || {}, {})
      .sort({ startTime: -1 })
      .limit(this.config.get('queryHistoryResultMaxRows'))
      .exec();
  }

  async removeOldEntries() {
    const days =
      this.config.get('queryHistoryRetentionTimeInDays') * 86400 * 1000;
    const retentionPeriodStartTime = new Date(new Date().getTime() - days);

    return this.nedb.queryHistory.remove(
      { createdDate: { $lt: retentionPeriodStartTime } },
      { multi: true }
    );
  }

  /**
   * Save queryHistory object
   * returns saved queryHistory object
   * @param {object} queryHistory
   */
  async save(data) {
    const joiResult = schema.validate(data);
    if (joiResult.error) {
      return Promise.reject(joiResult.error);
    }
    return this.nedb.queryHistory.insert(joiResult.value);
  }
}

module.exports = QueryHistory;
