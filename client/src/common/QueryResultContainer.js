import React from 'react';
import ErrorBlock from './ErrorBlock';
import InfoBlock from './InfoBlock';
import QueryResultDataTable from './QueryResultDataTable';
import QueryResultRunning from './QueryResultRunning';

function QueryResultContainer({ isRunning, queryError, queryResult }) {
  if (isRunning) {
    return <QueryResultRunning />;
  }
  if (queryError) {
    return <ErrorBlock>{queryError}</ErrorBlock>;
  }
  if (!queryResult || !queryResult.rows) {
    return null;
  }
  if (queryResult.status === 'finished' && queryResult.rows.length === 0) {
    return (
      <InfoBlock>
        Query finished
        <br />
        No rows returned
      </InfoBlock>
    );
  }
  return <QueryResultDataTable queryResult={queryResult} />;
}

export default QueryResultContainer;
