import React from 'react';
import ReactDOM from 'react-dom';

import { Input } from 'antd';
import "antd/dist/antd.css";

export default class SearchBox extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            searchValue: ''
        };
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        const {defaultSearch} = this.props;
        this.setState({
            searchValue: defaultSearch
        });
        this.initSearchBox();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {northeastLat, northeastLng, southwestLat, southwestLng} = this.props;
        if(northeastLat != prevProps.northeastLat || northeastLng!= prevProps.northeastLng||southwestLat != prevProps.southwestLat || southwestLng != prevProps.southwestLng) {
            this.initSearchBox();
        }

        if(prevProps.defaultSearch != this.props.defaultSearch) {
            this.setState({
                searchValue: this.props.defaultSearch
            });
        }
    }

    componentWillUnmount() {
        // this.searchBox.removeListener('places_changed', this.onPlacesChanged);
    }

    initSearchBox() {
        const input = ReactDOM.findDOMNode(this.inputRef);
        const {northeastLat, northeastLng, southwestLat, southwestLng} = this.props;
        const cityBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(northeastLat, northeastLng),
            new google.maps.LatLng(southwestLat, southwestLng));

        const options = {
            bounds: cityBounds,
            types: ['geocode'],
            componentRestrictions: {country: 'vn'}
        };
        this.searchBox = new google.maps.places.SearchBox(input, options);
        this.searchBox.addListener('places_changed', this.onPlacesChanged);
    }

    onPlacesChanged = () => {
        const places = this.searchBox.getPlaces();
        const bounds = new google.maps.LatLngBounds();
        bounds.union(places[0].geometry.viewport);
        const {handleFitBounds} = this.props;
        const s = bounds.getNorthEast().lat();
        const w = bounds.getNorthEast().lng();
        const n = bounds.getSouthWest().lat();
        const e = bounds.getSouthWest().lng()
        handleFitBounds(s, w, n, e);
    }

    setRef = (ref) => {
        this.inputRef = ref;
    }

    onChange(e) {
        let {value} = e.target;
        const {defaultSearch} = this.props;
        if(value.length < defaultSearch.length || (value.length==defaultSearch.length && value!=defaultSearch))
            value = defaultSearch;

        this.setState({
            searchValue: value
        });
    }

    render() {
        const {isMobile} = this.props;
        const width = isMobile? 200 : 250;
        return (
            <Input
                id='searchByMaps'
                value={this.state.searchValue}
                ref={this.setRef}
                type='text'
                placeholder='Tìm kiếm theo địa điểm'
                placeholderTextColor='#13222a'
                style={{
                    color: 'black',
                    width: width
                }}
                onChange={this.onChange}
            />
        );
    }
}
