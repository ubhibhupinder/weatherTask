import React from 'react';
import axios from 'axios';

class App extends React.Component {
	
  constructor(props) {
    super(props);

    this.state = {
      items: []
    };
  }


  componentDidMount() {
    axios.get(`http://localhost:8081`)
      .then(res => {
        const items = res.data.items;
        this.setState({ items });
      });
  }

	render() {
      return (
         <div>
            {this.state.items.map((weatherData, i) => <WeatherWidget key = {i} data = {weatherData} />)}
         </div>
      );
   }
}

class WeatherWidget extends React.Component{
	
	render() {
		return (
		<div className="weather">
			<div className="city"><h1>{this.props.data.name}</h1></div>
			<div className="clearfix"></div>
			<div className="details">
				<div className="temp">{this.props.data.avgTemp}&deg;C</div>
				<div className="humidity">Humidity: {this.props.data.avgHumidity}</div>
				<div className="pressure">Pressure: {this.props.data.avgPressure}</div>
			</div>
		</div>
	);
	}
} 

export default App;