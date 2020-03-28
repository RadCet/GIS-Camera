import React, {Component} from 'react';

import './styles/InfoWindow.css';

import event1trelac from './resources/events/event-1-trelac.png';
import event2toipham from './resources/events/event-2-toipham.png';
import event3bieutinh from './resources/events/event-3-bieutinh.png';
import event3chayno from './resources/events/event-4-chayno.png';
import event3bienso from './resources/events/event-5-bienso.png';
import eventviolate from './resources/events/violation.png';

import default_icon from './resources/vaevents/activity.svg';
import abandon_icon from './resources/vaevents/abandon.svg';
import access_icon from './resources/vaevents/access.svg';
import activity_icon from './resources/vaevents/activity.svg';
import face_icon from './resources/vaevents/face.svg';
import fire_icon from './resources/vaevents/fire.svg';
import flood_icon from './resources/vaevents/flood.svg';
import licese_plate_icon from './resources/vaevents/license-plate.svg';
import lost_icon from './resources/vaevents/lost.svg';
import motion_icon from './resources/vaevents/motion.svg';
import number_icon from './resources/vaevents/number.svg';
import pedestrian_icon from './resources/vaevents/pedestrian.svg';
import people_in_icon from './resources/vaevents/people-in.svg';
import people_out_icon from './resources/vaevents/people-out.svg';
import protest_icon from './resources/vaevents/protest.svg';
import reception_icon from './resources/vaevents/reception.svg';
import violence_icon from './resources/events/violation.png'

const cameraIcons = [event1trelac, event2toipham, event3bieutinh, event3chayno, event3bienso, eventviolate];

const cameraIconMap = {
    default: default_icon,
    abandon: abandon_icon,
    access: access_icon,
    activity: activity_icon,
    face: face_icon,
    fire: fire_icon,
    flood: flood_icon,
    licese_plate: licese_plate_icon,
    lost: lost_icon,
    motion: motion_icon,
    number: number_icon,
    pedestrian: pedestrian_icon,
    people_in: people_in_icon,
    people_out: people_out_icon,
    protest: protest_icon,
    reception: reception_icon,
    violence: violence_icon
};

class EventComponent extends Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        const {handleCatchCameraClick, event, eventCamData} = this.props;
        const from = new Date(event.startDate*1000);
        let fromStr = from.getFullYear() + '-' + (from.getMonth()+1) + '-' + from.getDate() + ' ';
        fromStr += from.getHours() + ':' + from.getMinutes() + ':' + from.getSeconds();
        let addr = '';
        if(eventCamData) addr = eventCamData.address.replace(new RegExp('_', 'g'), ' ');
        const eventTitle = from.toLocaleTimeString().replace(/:\d{2}\s/,' ') + ' - ' + event.eventName + ' - ' + addr;
        handleCatchCameraClick(fromStr, eventTitle, event);
    }

    render() {
        const {event, eventCamData} = this.props;
        const from = new Date(event.startDate*1000);
        let addr = '';
        
        if(eventCamData) addr = eventCamData.address.replace(new RegExp('_', 'g'), ' ');
        const timeText = from.toLocaleTimeString().replace(/:\d{2}\s/,' ');
        const eventStr = ' - ' + event.eventName + ' - ' + addr;
        const eventTitle = from.toLocaleString() + ' - ' + event.eventName + ' - ' + addr;
        // const thisIcon = cameraIcons[event.eventType-1];
        const thisIcon = cameraIconMap[event.eventType];
        const pStyle={
            fontSize: '15px',
            overflow: 'hidden',
            display: '-webkit-box',
            webkitLineClamp: '1',
            webkitBoxOrient: 'vertical'
        };
        return (
            <div role="presentation" onClick={this.onClick} style={{overflow: 'ellipsis', cursor: 'pointer'}}>
                <p style={pStyle} title={eventTitle}>
                    <img src={thisIcon ? thisIcon : default_icon} style={{width: 30, height: 30, borderRadius:50}} />
                    <span style={{marginLeft: '10px'}}>{timeText}</span>
                    {eventStr}
                </p>
            </div>
        );
    }
}

class ListEventComponent extends Component {

    render() {
        const {eventDetectData, cameraData, filterByClusterIDHandler, handleCatchCameraClick} = this.props;
        const eventShowDatas = eventDetectData.slice(0, 50);
        const eventCameraDatas = eventShowDatas.map(event => {
            return cameraData.find(item => item.vmsCamId == event.vmsCamId
                && filterByClusterIDHandler(item, event.clusterDataID));
        });
        return (
            <div
                className={'row'}
                style={{
                    justifyContent: 'center',
                    flexDirection: 'column',
                    alignItems: 'center',
                    // height: 'calc(100% - 400px)',
                    height:400,
                    margin: 0,
                    overflowY: 'scroll'
                }}
                id='styleScroll'
            >
                {
                    eventShowDatas.map((item, index) => (
                        <EventComponent
                            event={item}
                            eventCamData={eventCameraDatas[index]}
                            handleCatchCameraClick={handleCatchCameraClick}
                        />
                    ))
                }
            </div>
        )
    }
}

export default ListEventComponent;
