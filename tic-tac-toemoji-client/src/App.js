import React from 'react';
import logo from './logo.svg';
import './App.css';


class App extends React.Component {

  state = {user: []}

  componentDidMount() {
    fetch('/user')
      .then(res => res.json())
      .then(user => this.setState({ user }));
  }

  render() {
    return (
      <div className="App">
        <h1>User</h1>
        <div key={user.result.username}>{user.result.email}</div>

      </div>
    );
  }
}

export default App;
