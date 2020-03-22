class CameraTreeHelper {
    /***
     * Update treeData from parent node
     * @param parent
     * @param groupDatas all node
     * @returns list of child group of parent node
     */
    static updateChildsGroup(parent, groupDatas) {
        // TODO need opitimization
        let parentID = parent == null ? null : parent.Id;
        const childGroups = [];
        groupDatas
            .filter(group => group.ParentId === parentID)
            .forEach(group => {
                childGroups.push(group);
                group.parent = parent;
                CameraTreeHelper.updateChildsGroup(group, groupDatas);
            });
        if (parent != null) {
            parent.childGroups = childGroups;
            parent.childCameras = [];
        }
        return childGroups;
    }

    /***
     * Create treeData from tree info map data.
     * @param cameraDatas
     * @param ignoreGroupInvalid
     * @param ignoreCameraNotInChildGroup
     * @param clusterDataID
     * @returns {childCameras: [,...], childGroups: [,...], isVirtual: boolean}
     */
    static updateTreeData(cameraDatas, ignoreGroupInvalid = false, ignoreCameraNotInChildGroup = false, clusterDataID = null, combineDefaultGroupTarget = false) {
        const methodTag = "updateTreeData";
        let datas = cameraDatas;
        let tree = {childCameras : [], childGroups: [], isVirtual: true};
        if (Array.isArray(datas)) {
            if (datas.length > 1) {
                datas.forEach(cameraData => {
                    let target = cameraData.target;
                    let data = cameraData.data;
                    let dataClusterID = clusterDataID == null ? target.getID() : clusterDataID;
                    let treeNode = CameraTreeHelper.updateTreeData(data, ignoreGroupInvalid, ignoreCameraNotInChildGroup, dataClusterID);
                    if (combineDefaultGroupTarget) {
                        if (treeNode.childCameras.length === 0) {
                            if (treeNode.childGroups.length === 1) {
                                treeNode = treeNode.childGroups[0];
                            } else if (treeNode.childGroups.length === 0) {

                            }
                        }
                    }
                    treeNode.Id = `VMS${target.getID()}`;
                    treeNode.Name = target.Name;
                    treeNode.ParentId = null;
                    treeNode.childGroups.forEach(item => item.parent = treeNode);
                    treeNode.childCameras.forEach(item => {
                        if (item.groups) {
                            item.groups.push(treeNode);
                        } else {
                            item.groups = [treeNode];
                        }
                    });
                    tree.childGroups.push(treeNode);
                });
            } else if (datas.length === 1) {
                let cameraData = datas[0];
                let target = cameraData.target;
                let data = cameraData.data;
                let dataClusterID = clusterDataID == null ? target.getID() : clusterDataID;
                tree = CameraTreeHelper.updateTreeData(data, ignoreGroupInvalid, ignoreCameraNotInChildGroup, dataClusterID);
            }
        } else if (typeof(datas) === "object") {
            const {monitors, groups, monitors_groups, users_groups} = datas;//monitors_groups: [(monitor_id, group_group_id),(),...]
            if (monitors == null || groups == null || monitors_groups == null || users_groups == null) {
                console.error(`${methodTag}:datas input invalid`);
                return tree;
            }
            const groupIDs = [...new Set(groups.map(group => {
                group.clusterDataID = clusterDataID;
                group.parent = null;
                return group.Id;
            }))];
            if (!ignoreGroupInvalid) {
                groups.filter(group => group.ParentId != null)
                    .filter(group => groupIDs.find(id => id == group.ParentId) == null)
                    .forEach(group => group.ParentId = null);//TODO ??? add to other/special group for invalid group
            }
            const treeGroups = CameraTreeHelper.updateChildsGroup(null, groups);
            if (ignoreCameraNotInChildGroup) {
                groups.forEach(group => {
                    const GroupId = group.Id;
                    if (group.childCameras == null) {
                        group.childCameras = [];
                    }
                    monitors_groups.filter(cg => GroupId == cg.GroupId)
                        .map(cg => cg.MonitorId)
                        .map(monitorID => monitors.find(m => m.Id == monitorID))
                        .filter(camera => camera != null)
                        .forEach(camera => {
                            if (camera.groups)  {
                                camera.groups.push(group);
                            } else {
                                camera.groups = [group];
                            }
                            group.childCameras.push(camera);
                        });
                });
            } else {
                monitors.forEach(camera => {
                    const cameraID = camera.Id;
                    camera.groups = [];
                    monitors_groups.filter(cg => cameraID == cg.MonitorId)
                        .map(cg => cg.GroupId)
                        .map(groupId => groups.find(g => g.Id == groupId))
                        .filter(group => group != null)
                        .forEach(group => {
                            camera.groups.push(group);
                            if (group.childCameras) {
                                group.childCameras.push(camera);
                            } else {
                                group.childCameras = [camera];
                            }
                        });
                });
            }
            const camerasNotInGroup = monitors.filter(camera => {
                camera.clusterDataID = clusterDataID;
                return camera.groups == null || camera.groups.length === 0;
            });
            tree.childCameras = camerasNotInGroup;
            tree.childGroups = treeGroups;
            tree = CameraTreeHelper.normalTree(tree, users_groups);
        }
        return tree;
    }

    static buildUITreeData(tree, root = null, isAddCameraChild = false, handlerCameras = null, disabledIfEmpty = false) {
        const {childCameras, childGroups} = tree;
        let rootNode = root == null ?
            {   name: "", title: "", value: "", svalue:"", key: "", children: [] , numberLive: 0, numberAll: 0, allIDs : new Set(), liveIDs : new Set(),
                update: function() {
                    this.numberLive =  this.liveIDs.size;
                    this.numberAll =  this.allIDs.size;
                    this.title = `${this.name}(${this.numberLive}/${this.numberAll})`;
                    this.disabled = (disabledIfEmpty && this.numberLive === 0);
                    this.children = this.children.sort((node1, node2) => {
                        if (node1 != null && node1.title != null && node2 != null && node2.title != null) {
                            return node1.title.localeCompare(node2.title);
                        }
                        return -1;
                    });
                },
                parent: null
            } : root;
        if (handlerCameras != null || isAddCameraChild) {
            childCameras.forEach(camera => {
                const node = {
                    name : `${camera.Name}`,
                    title : `${camera.Name}`,
                    value : `${rootNode.value}/${camera.Id}.c`,
                    svalue: `${rootNode.svalue}/${camera.Name}`,
                    key   : `${camera.Id}.c`,
                    children: [],
                    parent: rootNode,
                    update: function() {
                        rootNode.update();
                    }
                };
                if (handlerCameras != null) {
                    handlerCameras(camera, node, rootNode);
                }
                if (isAddCameraChild) {
                    rootNode.children.push(node);
                }
            });
        }
        childGroups.forEach(group => {
            const node = {
                name : `${group.Name}`,
                title : `${group.Name}`,
                value : `${rootNode.value}/${group.Id}.g`,
                svalue: `${rootNode.svalue}/${group.Name}`,
                key   : `${group.Id}.g`,
                children: [],
                numberLive: 0,
                numberAll: 0,
                allIDs : new Set(),
                liveIDs : new Set(),
                parent: rootNode,
                update: function() {
                    this.numberLive =  this.liveIDs.size;
                    this.numberAll =  this.allIDs.size;
                    this.title = `${this.name}(${this.numberLive}/${this.numberAll})`;
                    this.disabled = (disabledIfEmpty && this.numberLive === 0);
                    this.children = this.children.sort((node1, node2) => {
                        if (node1 != null && node1.title != null && node2 != null && node2.title != null) {
                            return node1.title.localeCompare(node2.title);
                        }
                        return -1;
                    });
                }
            };
            rootNode.children.push(node);
            CameraTreeHelper.buildUITreeData(group, node, isAddCameraChild, handlerCameras, disabledIfEmpty);
            node.liveIDs.forEach(item => rootNode.liveIDs.add(item));
            node.allIDs.forEach(item => rootNode.allIDs.add(item));
            rootNode.numberLive =  rootNode.liveIDs.size;
            rootNode.numberAll =  rootNode.allIDs.size;
            rootNode.disabled = (disabledIfEmpty && rootNode.numberLive === 0);
        });
        rootNode.numberLive =  rootNode.liveIDs.size;
        rootNode.numberAll =  rootNode.allIDs.size;
        rootNode.title = `${rootNode.name}(${rootNode.numberLive}/${rootNode.numberAll})`;
        rootNode.children = rootNode.children.sort((node1, node2) => {
            if (node1 != null && node1.title != null && node2 != null && node2.title != null) {
                return node1.title.localeCompare(node2.title);
            }
            return -1;
        });
        rootNode.disabled = (disabledIfEmpty && rootNode.numberLive === 0);
        // TODO distinct cam
        return rootNode;
    }

    static markedTree(fullTree, user_group_ids = []) {
        // TODO copy fullTree
        if (user_group_ids == null || user_group_ids.length === 0) {
            return null;
        }
        let markedHandler = function(group, group_ids) {
            if (group.Id != null) {
                group.gChecked = group_ids.find(id => id == group.Id) != null;
                if (group.gChecked) {
                    let parent = group.parent;
                    while (parent != null) {
                        parent.cChecked = true;
                        parent = parent.parent;
                    }
                }
            }
            group.childGroups.forEach(child => markedHandler(child, group_ids));
            return group;
        };
        return markedHandler(fullTree, user_group_ids);
    }

    static normalTreeWithoutMarked(treeNodeMarked, parentNodeInput = null) {
        let parentNode = parentNodeInput;
        let {childCameras, childGroups} = treeNodeMarked;
        if (parentNode == null) {
            if (treeNodeMarked.isVirtual) {
                parentNode = {childCameras:childCameras, childGroups:[], isVirtual: true};
                childGroups.forEach(child => {
                    CameraTreeHelper.normalTreeWithoutMarked(child, parentNode);
                });
                return parentNode;// treeNodeMarked;
            }
            parentNode = {childCameras:[], childGroups:[], isVirtual: true};
        }
        if (treeNodeMarked.gChecked) {
            parentNode.childGroups.push(treeNodeMarked);
        } else if (treeNodeMarked.cChecked) {
            parentNode.childCameras = parentNode.childCameras.concat(childCameras);
            treeNodeMarked.childGroups = [];
            childGroups.forEach(child => {
                if (child.gChecked) {
                    treeNodeMarked.childGroups.push(child);
                } else if (child.cChecked) {
                    CameraTreeHelper.normalTreeWithoutMarked(child, treeNodeMarked);
                }
            });
            parentNode.childGroups.push(treeNodeMarked);
        }
        // distinct rootNode.childCameras
        parentNode.childCameras = [...new Set(parentNode.childCameras)];
        return parentNode;
    }

    static normalTreeWithoutMarked_flat(treeNodeMarked, parentNodeInput = null) {
        let rootNode = parentNodeInput == null ? {childCameras:[], childGroups:[]} : parentNodeInput;
        let {childCameras, childGroups} = treeNodeMarked;
        if (treeNodeMarked.gChecked) {
            rootNode.childGroups.push(treeNodeMarked);
        } else {
            rootNode.childCameras = rootNode.childCameras.concat(childCameras);
            childGroups.forEach(child => {
                if (child.gChecked) {
                    rootNode.childGroups.push(child);
                } else {
                    rootNode.childCameras = rootNode.childCameras.concat(child.childCameras);
                    CameraTreeHelper.normalTreeWithoutMarked_flat(child, rootNode);
                }
            });
        }
        // distinct rootNode.childCameras
        rootNode.childCameras = [...new Set(rootNode.childCameras)];
        return rootNode;
    }

    static normalTree(fullTree, user_group_ids = [], rootNodeSave) {
        let fullTreeMarked = CameraTreeHelper.markedTree(fullTree, user_group_ids);
        if (fullTreeMarked == null) {
            return fullTree;
        }
        return CameraTreeHelper.normalTreeWithoutMarked(fullTreeMarked, rootNodeSave);
    }

    static normalTree_flat(fullTree, user_group_ids = [], rootNodeSave) {
        let fullTreeMarked = CameraTreeHelper.markedTree(fullTree, user_group_ids);
        if (fullTreeMarked == null) {
            return fullTree;
        }
        return CameraTreeHelper.normalTreeWithoutMarked_flat(fullTreeMarked, rootNodeSave);
    }
}

// exports.CameraTreeHelper = CameraTreeHelper;
export default CameraTreeHelper;