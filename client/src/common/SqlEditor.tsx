import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { connect } from 'unistore/react';
import Measure from 'react-measure';
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ext-searchbox';
require(`ace-builds/src-noconflict/mode-sql`);
require(`ace-builds/src-noconflict/theme-sqlserver`);

const noop = () => {};

function SqlEditor({ config, onChange, readOnly, value, onSelectionChange, fontSize }) {
  const [dimensions, setDimensions] = useState({ width: -1, height: -1 });
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (editor && onChange) {
      // augment the built-in behavior of liveAutocomplete
      // built-in behavior only starts autocomplete when at least 1 character has been typed
      // In ace the . resets the prefix token and clears the completer
      // In order to get completions for 'sometable.' we need to fire the completer manually
      editor.commands.on('afterExec', (e) => {
        if (e.command.name === 'insertstring' && /^[\w.]$/.test(e.args)) {
          if (e.args === '.') {
            editor.execCommand('startAutocomplete');
          }
        }
      });

      editor.session.setUseWrapMode(Boolean(config.editorWordWrap));
    }
  }, [editor, onChange, config]);

  const handleSelection = (selection) => {
    if (editor && editor.session) {
      const selectedText = editor.session.getTextRange(selection.getRange());
      onSelectionChange(selectedText);
    }
  };

  render() {
    const { config, onChange, readOnly, value, height, fontSize } = this.props

  const setOptions = {
    useWorker: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: false,
    showLineNumbers: true,
    tabSize: 2,
  };

  return (
    <Measure
      bounds
      onResize={(contentRect) => setDimensions(contentRect.bounds)}
    >
      {({ measureRef }) => (
        <div ref={measureRef} className="h-100 w-100">
          <AceEditor
            editorProps={{ $blockScrolling: Infinity }}
            focus={!readOnly}
            height={height + 'px'}
            highlightActiveLine={false}
            mode="sql"
            name="query-ace-editor"
            onChange={onChange || noop}
            onLoad={(editor) => setEditor(editor)}
            onSelectionChange={handleSelection}
            readOnly={readOnly}
            setOptions={setOptions}
            showGutter={true}
            showPrintMargin={false}
            theme="sqlserver"
            value={value}
            width={width + 'px'}
            fontSize={fontSize}
          />
        </div>
      )}
    </Measure>
  );
}

SqlEditor.propTypes = {
  fontSize: PropTypes.number,
  onChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  readOnly: PropTypes.bool,
  value: PropTypes.string,
};

SqlEditor.defaultProps = {
  fontSize: 16,
  onSelectionChange: () => {},
  readOnly: false,
  value: '',
};

export default connect(['config'])(React.memo(SqlEditor));
