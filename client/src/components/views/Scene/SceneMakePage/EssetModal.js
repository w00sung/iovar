import React, { useState, useRef, useEffect } from "react";
import { Modal, message } from "antd";
import Axios from "axios";
import { useSelector } from "react-redux";

import EssetModalTab from "./Tab/EssetModalTab";
import CharacterTab from "./Tab/CharacterTab"
import BackgroundTab from "./Tab/BackgroundTab"
import BgmTab from "./Tab/BgmTab"
import SoundTab from "./Tab/SoundTab"
import { LOCAL_HOST } from "../../../Config";
import _ from "lodash";
import "./EssetModal.css";

const config = require('../../../../config/key');

const EssetModal = ({ setGameDetail, gameDetail, gameId, visible, setTag, tag, setReload, uploadCharFileFlag, uploadFileFlag, assetUsedFlag }) => {
  const user = useSelector((state) => state.user);


  //! -------- 처리 될 녀석들 -------
  const [typeQueue, setTypeQueue] = useState([]);
  const [charFileQueue, setCharFileQueue] = useState([]);
  const [charBlobList, setCharBlobList] = useState([]);
  const [bgmBlobNames, setBgmBlobNames] = useState([]); //!
  const [soundBlobNames, setSoundBlobNames] = useState([]); //!
  const tempAssetUsedFlag = useRef(assetUsedFlag.current) // !
  //! -------------------------------

  const [fileQueue, setFileQueue] = useState([]);

  const [blobBgmList, setBlobBgmList] = useState([]); //! 이름 교체
  const [blobSoundList, setBlobSoundList] = useState([]); //! 이름 교체



  const [blobBackList, setBlobBackList] = useState([]);
  const [blobCharList, setBlobCharList] = useState([])


  const [blobGame, setBlobGame] = useState([]);

  const charPageNum = useRef(0);
  const uploadFlag = useRef(false)
  const assetFlag = useRef(true)
  const assetList = useRef([])

  const blobAssetList = useRef([])
  const DBForm = useRef({ gameId: gameId, background: [], bgm: [], sound: [] })

  useEffect(() => {
    if (gameDetail)
      setBlobGame(_.cloneDeep(gameDetail)); //! 기존 녀석들의 복제품!! -- 잘 사용해보자
    console.log("use EFFECT ", blobGame)
  }, [gameDetail])

  const revokeBlobList = () => {
    blobCharList.forEach(function (value) {
      if (value)
        URL.revokeObjectURL(value)
    });
    blobBackList.forEach(function (value) {
      if (value)
        URL.revokeObjectURL(value)
    });
    blobBgmList.forEach(function (value) {
      if (value)
        URL.revokeObjectURL(value)
    });
    blobSoundList.forEach(function (value) {
      if (value)
        URL.revokeObjectURL(value)  //! url을 지워준다.
    });
  }


  const cancelUpload = () => {
    revokeBlobList();
    setTag(0)
    tempAssetUsedFlag.current = assetUsedFlag.current
  }

  const upload = () => {

    if (!uploadFlag.current) {
      uploadFlag.current = true;


      //! CAUTION : files "+ asset"  is possible --- stack on DB FORM
      if (fileQueue.length) // if there are files, upload -> blobToReal
        uploadFiles(fileQueue);
      else {
        blobToReal(null, null)  // just blobToReal
      }


    }


    // if (!uploadFlag.current) {
    //   revokeBlobList(); //! blobList를 지워준다.

    //   uploadCharFiles()



    //   if (fileQueue.length) {
    //     uploadFiles()
    //   }
    //   else if (blobAssetList.current.length) {
    //     assetsToForm(blobAssetList.current) // form 에 다 쌓아놓을게요
    //   }

    //   assetUsedFlag.current = tempAssetUsedFlag.current // for memory assets that selected
    // }
  };

  //! --------------- NEW --------------------------------
  const uploadFiles = async (files) => {
    console.log("uploadFiles", files)
    let formData = new FormData();
    let typeList = []
    for (let i = 0; i < files.length; i++) {
      let asset = files[i]
      switch (asset.type) {
        case "character":
          for (let j = 0; j < asset.fileArray.length; j++) {
            formData.append('files', asset.fileArray[j])
            typeList.push({ type: asset.type, id: asset.id })
          }
          break;

        default:
          formData.append('files', asset.file)
          typeList.push({ type: asset.type })
          break;
      }
    }
    setFileQueue([])
    //! upload file 
    const config = {
      header: { "encrpyt": "multipart/form-data" },
    };

    const response = await Axios.post("/api/game/uploadfile", formData, config)
    if (response.data.success) {
      console.log("uploads COMPLETE", response.data.files)
      blobToReal(response.data.files, typeList,)
    }
    else {
      console.log("uploads FAIL")
    }
  }

  const blobToReal = async (files, typeList) => {
    const tmpBlobGame = blobGame;
    if (files) {
      let filePath;
      for (let i = 0; i < typeList.length; i++) {
        filePath = process.env.NODE_ENV === 'development' ? `${config.SERVER}/${files[i].path}` : files[i].location
        if (typeList[i].type === "character") {
          // which character, which place
          let characterIdx = tmpBlobGame.character.findIndex(character => character.id === typeList[i].id)
          //! blob -> REAL
          let fileIdx = tmpBlobGame.character[characterIdx].image_array.findIndex(file => file.substr(0, 5) === 'blob:')
          tmpBlobGame.character[characterIdx].image_array[fileIdx] = filePath
        }
        else if (typeList[i].type === "background") {
          // tmpBlobGame.background
        }
        else if (typeList[i].type === "bgm") {

        }
        else if (typeList[i].type === "sound") {

        }
      }
      setBlobGame(tmpBlobGame)
    }
    const response = await Axios.post("/api/game/update", {
      gameId,
      character: tmpBlobGame.character,
      background: tmpBlobGame.background,
      bgm: tmpBlobGame.bgm,
      sound: tmpBlobGame.sound
    })
    if (response.data.success) {
      console.log("SUCCESS", tmpBlobGame)
      // setGameDetail(tmpBlobGame)
      setReload(reload => reload + 1)
      setTag(0)
    }
    else {
      message.error("update 오류가 발생했습니다.")
    }




  }


  //! ----------------------------------------------------

  const uploadCharFiles = async () => {
    if (charFileQueue.length) {
      let fileNum = Array.from({ length: blobGame.character.length }, () => 0);
      let formData = new FormData();
      for (var i = 0; i < blobGame.character.length; i++) { //! 캐릭터 수
        //파일 합치기        
        for (var j = 0; j < charFileQueue.length; j++) { //! 캐릭터의 image array만큼
          if (charFileQueue[j].index === i) {
            fileNum[i] += charFileQueue[j].array.length
            charFileQueue[j].array.forEach(function (value) {
              formData.append('files', value);
            });
          }
        }
      }
      const config = {
        header: { "encrpyt": "multipart/form-data" },
      };

      //! 공유자원 여부 체크하고 axios post 보내기


      const response = await Axios.post("/api/game/uploadfile", formData, config)
      if (response.data.success) {
        uploadCharDB(fileNum, response.data.files);
      } else {
        alert("캐릭터 DB 업로드 실패");
      }

    } else {
      uploadCharDB(null, null);
    }

  }

  const uploadCharDB = (fileNum, files) => {
    let cnt = 0
    for (var i = 0; i < blobGame.character.length; i++) {
      let isAsset = blobGame.character[i].isAsset ? true : false //asset or not
      let isUploaded = uploadCharFileFlag.current[i] ? true : false
      if (!gameDetail.character[i])
        gameDetail.character.push({
          name: "",
          description: "",
          image_array: [],
        })
      gameDetail.character[i].name = blobGame.character[i].name;
      gameDetail.character[i].description = blobGame.character[i].description;

      if (isAsset) {
        gameDetail.character[i].image_array = blobGame.character[i].image_array
      }

      if (fileNum && !isAsset) {  //! only if it has files added
        for (var j = cnt; j < cnt + fileNum[i]; j++) {
          gameDetail.character[i].image_array.push(process.env.NODE_ENV === 'development' ? `${config.SERVER}/${files[j].path}` : files[j].location)
        }
        cnt += fileNum[i]
      }




      if (assetFlag.current && !isUploaded && !isAsset) {
        //! asset 별로 DB에 넣을 것이다. uploadCharFileFlag : already uploaded or not
        let assetCharacter = {
          assetType: "character",
          writer: {
            id: user.userData._id,
            nickname: user.userData.nickname,
          },
          character: gameDetail.character[i]
        }
        assetList.current.push(assetCharacter)
        uploadCharFileFlag.current[i] = true
        //! flag ON : upload 된 녀석 -- 삭제 구현시 false로 변경해주면서 splice!
        //! ps. 삭제 구현시 꼭 저에게 말씀주세요 - 우성
      }
    }
    const DBForm = {
      gameId: gameId,
      character: gameDetail.character
    };

    Axios.post(
      "/api/game/putCharDB",
      DBForm
    ).then((response) => {
      if (response.data.success) {
        // character파일만 올리는 경우
        if (!fileQueue.length) {
          setReload(reload => reload + 1)
          setTag(0)
          // uploadAsset() //! asset 추가 타이밍
        }
      } else {
        message.error("DB 업데이트 실패");
      }
    });


  }


  // const uploadFiles = async () => {

  //   //upload file queue
  //   let formData = new FormData();
  //   fileQueue.forEach(value => {
  //     formData.append('files', value);
  //   })
  //   const header = {
  //     header: { "encrpyt": "multipart/form-data" }, //content type을 같이 보내줘야한다!
  //   };

  //   const response = await Axios.post("/api/game/uploadfile", formData, header)
  //   if (response.data.success) {

  //     uploadDB(response.data.files);
  //   } else {
  //     alert("업로드 실패");
  //   }

  // }


  const uploadDB = (files) => {

    // const DBForm = { gameId: gameId, background: [], bgm: [], sound: [] };

    for (var i = 0; i < files.length; i++) {
      let asset;
      switch (typeQueue[i]) {
        case 1: //background
          asset = {
            name: files[i].originalname,
            image: (process.env.NODE_ENV === 'development' ? `${config.SERVER}/${files[i].path}` : files[i].location),
          }
          DBForm.current.background.push(asset)

          if (assetFlag.current && uploadFileFlag.current[i] !== true) {
            let assetBackground = {
              assetType: "background",
              writer: {
                id: user.userData._id,
                nickname: user.userData.nickname,
              },
              background: asset
            }
            assetList.current.push(assetBackground)
          }
          break;
        case 2:
          asset = {
            name: files[i].originalname,
            music: (process.env.NODE_ENV === 'development' ? `${config.SERVER}/${files[i].path}` : files[i].location),
          }
          DBForm.current.bgm.push(asset)
          if (assetFlag.current && uploadFileFlag.current[i] !== true) {
            let assetBgm = {
              assetType: "bgm",
              writer: {
                id: user.userData._id,
                nickname: user.userData.nickname,
              },
              bgm: asset
            }
            assetList.current.push(assetBgm)
          }
          break;
        case 3:
          asset = {
            name: files[i].originalname,
            music: (process.env.NODE_ENV === 'development' ? `${config.SERVER}/${files[i].path}` : files[i].location),
          }
          DBForm.current.sound.push(asset)
          if (assetFlag.current && uploadFileFlag.current[i] !== true) {
            let assetSound = {
              assetType: "sound",
              writer: {
                id: user.userData._id,
                nickname: user.userData.nickname,
              },
              sound: asset
            }
            assetList.current.push(assetSound)
          }
          break;
        default:
          message.error("정의되지 않은 업로드 버튼입니다.");
          break;
      }
      uploadFileFlag.current[i] = true
    }
    if (blobAssetList.current.length) {
      assetsToForm(blobAssetList.current.length)  //! asset으로 추가한 것이 있다면?
    }
    else {
      uploadFormToDB(DBForm.current)
    }


  }

  const assetsToForm = (blobAssets) => {
    for (let i = 0; i < blobAssets.length; i++) {
      let asset;

      if (blobAssets[i]?.assetType === "background") {
        asset = {
          name: blobAssets[i].background.name,
          image: blobAssets[i].background.image,
        }
        DBForm.current.background.push(asset)

      }
      else if (blobAssets[i]?.assetType === "bgm") {
        asset = {
          name: blobAssets[i].bgm.name,
          music: blobAssets[i].bgm.music,
        }
        DBForm.current.bgm.push(asset)

      }
      else if (blobAssets[i]?.assetType === "sound") {
        asset = {
          name: blobAssets[i].sound.name,
          music: blobAssets[i].sound.music,
        }

        DBForm.current.sound.push(asset)
      }
    }
    blobAssets = [] // upload 후 초기화
    uploadFormToDB(DBForm.current)
  }

  const uploadFormToDB = (form) => {
    if (form.background?.length || form.bgm?.length || form.sound?.length) {
      Axios.post(
        "/api/game/putDB",
        form
      ).then((response) => {
        if (response.data.success) {
          setReload(reload => reload + 1)
          setTag(0)
          // uploadAsset() //! asset 추가 타이밍
        } else {
          message.error("DB 업데이트 실패");
        }
      });
      form = { gameId: gameId, background: [], bgm: [], sound: [] }
    }
    else {

      setReload(reload => reload + 1)
      setTag(0)
    }
  }

  const uploadAsset = () => {

    if (assetFlag.current) {
      Axios.post(
        "/api/asset",
        { assetList: assetList.current }
      ).then((response) => {
        if (response.data.success) {
          message.info("에셋 저장 완료")
          assetList.current = []
        }
        else {
          message.error("에셋 저장 실패")
        }
      })
    }

  }

  return (
    <Modal className="scenemake_modal"
      visible={visible}
      okText="추가하기"
      cancelText="취소"
      onCancel={cancelUpload}
      onOk={upload}
      width={1500}
      closable={false}
      keyboard={false}
      maskClosable={false}
      style={{ top: 50 }}
    >
      <div className="sceenmake_modal_container">
        <EssetModalTab setTag={setTag} tag={tag} />
        {tag === 1 &&
          <CharacterTab
            charPageNum={charPageNum}
            // setCharFileQueue={setCharFileQueue}
            // setCharBlobList={setCharBlobList}

            assetUsedFlag={tempAssetUsedFlag}
            blobAssetList={blobAssetList}


            blobGame={blobGame}
            setBlobGame={setBlobGame}
            setFileQueue={setFileQueue}
            blobCharList={blobCharList}
            setBlobCharList={setBlobCharList}

          />
        }
        {tag === 2 &&
          <BackgroundTab
            gameDetail={gameDetail}
            setFileQueue={setFileQueue}
            setTypeQueue={setTypeQueue}
            setBlobBackList={setBlobBackList}
            blobBackList={blobBackList}
            assetUsedFlag={tempAssetUsedFlag}
            blobAssetList={blobAssetList}

          />
        }
        {tag === 3 &&
          <BgmTab
            gameDetail={gameDetail}
            setFileQueue={setFileQueue}
            setTypeQueue={setTypeQueue}
            setBlobBgmList={setBlobBgmList}
            blobBgmList={blobBgmList}
            setBgmBlobNames={setBgmBlobNames}
            bgmBlobNames={bgmBlobNames}
            assetUsedFlag={tempAssetUsedFlag}
            blobAssetList={blobAssetList}

          />
        }
        {tag === 4 &&
          <SoundTab
            gameDetail={gameDetail}
            setFileQueue={setFileQueue}
            setTypeQueue={setTypeQueue}
            setBlobSoundList={setBlobSoundList}
            blobSoundList={blobSoundList}
            setSoundBlobNames={setSoundBlobNames}
            soundBlobNames={soundBlobNames}
            assetUsedFlag={tempAssetUsedFlag}
            blobAssetList={blobAssetList}

          />
        }
      </div>
    </Modal>

  )
}
export default EssetModal
