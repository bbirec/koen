const low = require('lowdb')
const storage = require('lowdb/file-sync')
const db = low('db.json', { storage })
var uuid = require('node-uuid');
var _ = require('lodash');

const DB_REFS = 'refs'
const DB_ATTEMPTS = 'attempts'

var AddRef = React.createClass({
  propTypes: {
    onDashBoard: React.PropTypes.func
  },
  getInitialState: function() {
    return {en:"", ko:""};
  },
  onChange: function(key, event) {
    var o = {};
    o[key] = event.target.value;
    this.setState(o);
  },
  onAdd: function() {
    db(DB_REFS).push({
      id: uuid.v4(), 
      en: this.state.en, 
      ko: this.state.ko,
      date: moment()});
    this.props.onDashBoard();
  },
  render: function() {
    return (
      <div className="db">
        <form className="pure-form pure-form-stacked">
          <label>영어 문장</label>
          <textarea 
            placeholder="Most hackers are young because young people tend to be adaptable. As long as you remain adaptable, you can always be a good hacker."
            value={this.state.en}
            onChange={this.onChange.bind(this, "en")}></textarea>
          <label>한글 번역</label>
          <textarea placeholder="대부분의 해커가 어린 이유는 어린 사람들이 보통 적응을 잘하기 때문이다. 당신이 계속 적응을 잘 하는 한, 당신은 언제든 좋은 해커가 될 수 있다."
            value={this.state.ko}
            onChange={this.onChange.bind(this, "ko")}></textarea>
          <button type="button" className="pure-button pure-button-primary" onClick={this.onAdd}>입력하기</button>
          <button type="button" className="pure-button" onClick={this.props.onDashBoard}>취소</button>
        </form>
      </div>
    )
  }
});


var ListRef = React.createClass({
  propTypes: {
    onDashBoard: React.PropTypes.func
  },
  reload: function() {
    this.forceUpdate();
  },
  render: function() {
    return (
      <div>
        <button type="button" className="pure-button" onClick={this.props.onDashBoard}>돌아가기</button>
        <table className="pure-table">
          <thead>
            <tr>
              <td>#</td>
              <td>영어문장</td>
              <td>한글문장</td>
              <td>날짜</td>
            </tr>
          </thead>
          <tbody>
            {db(DB_REFS).orderBy('date', 'desc').map(function(ref) {
              return (
                <tr>
                  <td>{ref.id}</td>
                  <td>{ref.en}</td>
                  <td>{ref.ko}</td>
                  <td>{moment(ref.date).format('YYYY-MM-DD')}</td>
                </tr>);
            }.bind(this))}
          </tbody>
        </table>
      </div>
    );
  }
});


var Exercise = React.createClass({
  propTypes: {
    refId: React.PropTypes.string,
    onDashBoard: React.PropTypes.func
  },
  getInitialState: function() {
    return {
      ref: db(DB_REFS).find({id: this.props.refId}),
      first: "", 
      second: "", 
      third:""};
  },
  onChange: function(key, event) {
    var o = {};
    o[key] = event.target.value;
    this.setState(o);
  },
  onAdd: function() {
    var texts = _.filter([this.state.first, this.state.second, this.state.third], 
      function(i) {
        return !_.isEmpty(i)
      });

    db(DB_ATTEMPTS).push({
      id: uuid.v4(), 
      refId: this.props.refId,
      texts: texts,
      date: moment()});

    this.props.onDashBoard();
  },
  render: function() {
    return (
      <div className="exercise">

        <h2>{this.state.ref.ko}</h2>
        <form className="pure-form pure-form-stacked">
          <label>첫번째 시도</label>
          <textarea placeholder="첫번째 시도"
            value={this.state.first}
            onChange={this.onChange.bind(this, "first")}></textarea>
          <label>두번째 시도</label>
          <textarea placeholder="두번째 시도"
            value={this.state.second}
            onChange={this.onChange.bind(this, "second")}></textarea>
          <label>세번째 시도</label>
          <textarea placeholder="세번째 시도"
            value={this.state.third}
            onChange={this.onChange.bind(this, "third")}></textarea>  
          <div>
            <button type="button" className="pure-button pure-button-primary" onClick={this.onAdd}>입력하기</button>
            <button type="button" className="pure-button" onClick={this.props.onDashBoard}>취소</button>
          </div>
        </form>
      </div>
    )
  }
});


var Dashboard = React.createClass({
  propTypes: {
    onAddRef: React.PropTypes.func,
    onListRef: React.PropTypes.func,
    onExercise: React.PropTypes.func,
  },
  renderTexts: function(texts) {
    var items = texts.map(function(text){
      return (<li>{text}</li>);
    });

    return (<ul>{items}</ul>);
  },
  renderRow: function(date, attempts) {
    var icon = attempts.length > 0 ? (<i className="fa fa-check-circle" style={{color: '#5cb85c'}}></i>) : null;

    return (
      <tr>
        <td>{date.format("YYYY-MM-DD")}</td>
        <td>{icon}</td>
        <td>
          {attempts.map(function(attempt) {
            return this.renderTexts(attempt.texts);
          }.bind(this))}
        </td>
      </tr>
    )
  },
  selectRef: function() {
    // TODO: Select a best ref.
    // 1. Never excercised first.
    // 2. Not recently used.
    var refIds = db(DB_REFS).map('id');
    var exercisedIds = db(DB_ATTEMPTS).map('refId');
    
    var neverUsed = _.difference(refIds, exercisedIds);
    if(_.isEmpty(neverUsed)) {
      return _.sample(refIds);
    }
    else {
      return _.sample(neverUsed);
    }
  },
  render: function() {
    // Attemps of this month
    var attempts = db(DB_ATTEMPTS)
      .chain()
      .filter(function(o) {
        return moment(o.date).isSame(moment(), 'month');
      })
      .value();

    var refIds = db(DB_REFS).map('id');
    var exercisedIds = db(DB_ATTEMPTS).map('refId');

    // Count the refs have not been exercised before.
    var used = _.intersection(refIds, exercisedIds).length;
    var neverUsed = _.difference(refIds, exercisedIds).length;
    var promoteToAdd = neverUsed < 10;


    var studyButton;
    if(neverUsed < 10) {
      // Promote to add a new ref.
      studyButton = (<button className="pure-button pure-button-disabled start">{10 - neverUsed}개 DB를 더 입력하세요.</button>);
    }
    else {
      studyButton = (<button className="pure-button pure-button-primary start"
            onClick={this.props.onExercise.bind(this, this.selectRef())}>오늘의 영어 공부 시작</button>);
    }
    
    return (
      <div>
        <div>
          {studyButton}
        </div>
        <div>
          <button className="pure-button"
            onClick={this.props.onAddRef}>DB입력</button>
          &nbsp;
          <button className="pure-button"
            onClick={this.props.onListRef}>DB보기</button>
        </div>
        <div>
          <h2>나의 영어 일지({moment().year()}년 {moment().month()+1}월)</h2>
          <table className="pure-table">
            <thead>
              <tr>
                <td>날짜</td>
                <td>상태</td>
                <td>영어문장</td>
              </tr>
            </thead>
            <tbody>
              {_.range(1, moment().date() + 1).map(function(d){
                var day = moment([moment().year(), moment().month(), d]);
                
                var targetAttempts = _.filter(attempts, function(attempt) {
                  return moment(attempt.date).isSame(day, 'day');
                });

                return this.renderRow(day, targetAttempts);
              }.bind(this))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
});

// mode :
// dashboard, addRef, listRef, exercise

var App = React.createClass({
  getInitialState: function() {
    return {
      mode: 'dashboard',
      exerciseId: null, 
    }
  },
  exercise: function(id) {
    this.setState({mode: 'exercise', exerciseId: id})
  },
  dashboard: function() {
    this.setState({mode: 'dashboard', exerciseId: null});
  },
  addRef: function() {
    this.setState({mode: 'addRef'});
  },
  listRef: function() {
    this.setState({mode: 'listRef'});
  },
  render: function() {
    var content;

    switch(this.state.mode) {
      case 'addRef':
        content = (<AddRef onDashBoard={this.dashboard}/>);
        break;
      case 'listRef':
        content = (<ListRef onDashBoard={this.dashboard}/>);
        break;
      case 'exercise':
        content = (<Exercise refId={this.state.exerciseId} onDashBoard={this.dashboard}/>);
        break;
      default: // dashboard
        content = (<Dashboard onAddRef={this.addRef} 
          onListRef={this.listRef} 
          onExercise={this.exercise}/>);
        break;
      
    }

    return (
      <div>
        {content}
      </div>
    );
  }
});

ReactDOM.render(
  <App/>,
  document.getElementById('container')
);