import React, { useEffect, useState } from "react";
import { message } from "antd";
import MyDropzone from "../../../Dropzone/MyDropzone";
import "../EssetModal.css";
import "./MusicTab.css";
import "./Upload.css";

import AssetLibraryModal from "../AssetLibraryModal"

let bgm_audio = new Audio();
bgm_audio.loop = true;
function BgmTab({ gameDetail, setFileQueue, setTypeQueue, setBgmBlobList, bgmBlobList, setBgmBlobNames, bgmBlobNames, blobAssetList, assetUsedFlag }) {
    const [LibraryModalVisible, setLibraryModalVisible] = useState(false)

    const [bgmCards, setBgmCards] = useState([]);
    const [blobCards, setBlobCards] = useState([]);
    const [toggle, setToggle] = useState(0);

    const onDrop = (files) => {
        for (var i = 0; i < files.length; i++) {
            if (!files[i]) {
                message.error("10MB 이하의 음원 파일을 업로드해주세요.");
                return;
            }
            setFileQueue(oldArray => [...oldArray, files[i]])
            setTypeQueue(oldArray => [...oldArray, 2])

            setBgmBlobNames(oldArray => [...oldArray, files[i]])
            setBgmBlobList(oldArray => [...oldArray, URL.createObjectURL(files[i])])
        }
    };

    // 왜 인자로 넘어온 game이 처음에 존재하지 않는지 모르겠음
    useEffect(() => {
        if (gameDetail.bgm)
            setBgmCards(gameDetail.bgm.map((element, index) => {
                let cutIdx = bgm_audio.src.lastIndexOf("/") + 1;
                let bgm_uri = decodeURI(bgm_audio.src.substr(cutIdx))
                return (
                    <div className={`bgmTab_text_box ${bgm_uri === element.music.substr(cutIdx)}`} key={index}
                        onClick={() => {
                            if (bgm_audio.paused || bgm_uri !== element.music.substr(cutIdx)) {
                                bgm_audio.src = (element.music)
                                bgm_audio.play();
                            } else {
                                bgm_audio.src = ""
                                bgm_audio.pause();
                            }
                            setToggle(toggle => toggle + 1);
                        }}>
                        {element.name}
                    </div>
                )
            }))
    }, [gameDetail, toggle]);


    useEffect(() => {
        if (bgmBlobList)
            setBlobCards(bgmBlobList.map((element, index) => {
                let cutIdx = bgm_audio.src.lastIndexOf("/") + 1;

                return (
                    <div className={`bgmTab_text_box ${bgm_audio.src === element || bgm_audio.src.substr(cutIdx) === element.music.substr(cutIdx)}}`} key={index}
                        onClick={() => {
                            if (bgm_audio.paused || bgm_audio.src !== element) {
                                bgm_audio.src = element.music || element
                                bgm_audio.play();
                            } else {
                                bgm_audio.src = ""
                                bgm_audio.pause();
                            }
                            setToggle(toggle => toggle + 1);
                        }}>
                        {element.name || bgmBlobNames[index].name}
                    </div>
                )
            }))
    }, [bgmBlobList, toggle]);

    useEffect(() => {
        return () => {
            bgm_audio.pause();
            bgm_audio.src = ""
        };
    }, []);

    return (
        <div className="bgmTab_container">
            <div className="upload_container">
                <div className="upload_library"
                    onClick={() => setLibraryModalVisible(true)}>
                    스토어에서 불러오기
                </div>
                <AssetLibraryModal
                    visible={LibraryModalVisible}
                    setVisible={setLibraryModalVisible}
                    assetType="bgm"
                    assetUsedFlag={assetUsedFlag}
                    setBlob={setBgmBlobList}
                    setBlobName={setBgmBlobNames}
                    blobAssetList={blobAssetList}
                />
                <div className="bgmTab_dropzone">
                    <MyDropzone
                        onDrop={onDrop}
                        multiple={true}
                        maxSize={10485761} // 10MB + 1
                        accept="audio/*"
                        type="bgm"
                        icon="audio"
                    >
                    </MyDropzone>
                </div>
            </div>
            <div className="bgmTab_Box">
                {bgmCards !== 0 && <div>{bgmCards}</div>}
                {blobCards !== 0 && <div>{blobCards}</div>}
            </div>
        </div>
    );
}

export default BgmTab;
