import React from 'react';

import CameraTreeHelper from './controller/CameraTreeHelper';

import cameraIcon0 from './resources/icons/statisicon/0.png';
import cameraIcon1 from './resources/icons/statisicon/1.png';
import cameraIcon2 from './resources/icons/statisicon/2.png';
import cameraIcon3 from './resources/icons/statisicon/3.png';
import cameraIcon4 from './resources/icons/statisicon/4.gif';
import cameraIcon5 from './resources/icons/statisicon/5.png';
import cameraIcon6 from './resources/icons/statisicon/6.png';
import cameraIcon7 from './resources/icons/statisicon/7.png';

export const StatisData ={
    ALL:   { title: "Tổng số Camera", color: "#0abf71", icon: cameraIcon1 },
    UNBROKEN:  { title: "Camera đang hoạt động", color: "#0abf71", icon: cameraIcon1 },
    ACTIVE: { title: "Có lưu trữ TTĐH", color: "#0abf71", icon: cameraIcon1},
    UNACTIVE: { title: "Không lưu trữ TTĐH", color: "#2dc0d2", icon: cameraIcon2 },
    BROKEN: { title: "Camera không hoạt động", color: "#ec1c23", icon: cameraIcon0 },
    AI: { title: "Camera phân tích AI", color: "#0abf71", icon: cameraIcon3 },
    EVENT5P: { title: "Mới có sự kiện", color: "#ec1c23", icon: cameraIcon4 },
    EVENT24H: { title: "Có sự kiện trong ngày", color: "#ff7708", icon: cameraIcon5 },
    SOCIAL: { title: "Camera xã hội hóa", color: "#751f13", icon: cameraIcon6 },
    UNDONE: { title: "Chưa lấy về", color: "#777777", icon: cameraIcon7 },
    VMS:  { title: "Danh sách VMS", color: "#0abf71", icon: cameraIcon1 },
};

class CameraNode extends React.Component {

    render() {
        const {node, tag, handleFilter, currentLayer} = this.props;
        const boldStyle = {fontWeight: 'bold'};
        return (
            <div style={{marginBottom: '8px', cursor: 'pointer', paddingLeft: 10 * tag}} onClick={()=>handleFilter(node)}>
                <img src={StatisData.VMS.icon} style={{width: '25px'}} />
                <span style={currentLayer == node.value ? boldStyle : {}}>&nbsp;{node.name}</span>
                <span style={{float: 'right', color: StatisData.VMS.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{node.numberAll}&nbsp;</span>
            </div>
        );
    }

}

class CameraGroupNode extends React.Component {

    render() {
        const {node, tag, maxTag, handleFilter, currentLayer} = this.props;
        return (
            (maxTag >= 0 && tag > maxTag) ? "" :
                Array.isArray(node) ?
                    node.filter((child, index) => true)
                        .map((child, index) => {
                            return <div style={{paddingLeft: 10 * tag}} key={index}>
                                <CameraNode
                                    node={child}
                                    index={index}
                                    tag={tag}
                                    handleFilter={handleFilter}
                                    currentLayer={currentLayer}/>
                                { child.children.length > 0 &&
                                <CameraGroupNode
                                    node={child}
                                    tag={tag}
                                    maxTag={maxTag}
                                    handleFilter={handleFilter}
                                    currentLayer={currentLayer}/> }
                            </div>
                        }) :
                    typeof(node) === "object" ?
                        <div style={{paddingLeft: 10 * tag}}>
                            { Array.isArray(node.children) &&
                            <CameraGroupNode
                                node={node.children}
                                tag={tag + 1}
                                maxTag={maxTag}
                                handleFilter={handleFilter}
                                currentLayer={currentLayer}/> }
                        </div> : ""
        )
    }
}

class CameraStatusGroupCounting extends React.Component {

    render() {
        const {treeData, tag, maxTag, handleFilter, currentLayer, showSumNode } = this.props;
        console.log(`startTag:${tag}:maxTag:${maxTag}`);
        let sum = showSumNode ? CameraTreeHelper.getAllMonitors(treeData) : 0;
        const rootNode = {
            name: "Tổng số Camera",
            title: `Tổng số Camera`,
            value: null,
            svalue:"",
            key: "" + new Date().getTime(),
            children: treeData ,
            numberLive: sum,
            numberAll: sum,
            allIDs : [],
            liveIDs : [],
            parent: null
        };
        return (
            <div>
                {showSumNode &&
                <CameraNode
                    node={rootNode}
                    index={-1}
                    tag={tag}
                    handleFilter={handleFilter}
                    currentLayer={currentLayer}/>
                }
                <CameraGroupNode
                    node={treeData}
                    tag={tag}
                    maxTag={maxTag + (showSumNode ? 1 : 0)}
                    handleFilter={handleFilter}
                    currentLayer={currentLayer}/>
            </div>
        )
    }
}

export default CameraStatusGroupCounting;
