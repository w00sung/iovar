import "../Scene/SceneMakePage/GamePlusScene.css";
import CharacterBlock from "./CharacterBlock";
import { TextBlock, TextBlockChoice } from "./TextBlock.js";
import React, { useEffect, useState } from "react";
import Axios from "axios";
import DislikePopup from "./Dislike";
import HistoryMapPopup from "./HistoryMap";
import LoadingPage from "./LoadingPage";
import { message } from "antd";
import useKey from "../../functions/useKey";
import { useDispatch } from "react-redux";
import { gameLoadingPage } from "../../../_actions/gamePlay_actions";
import { navbarControl } from "../../../_actions/controlPage_actions";

var bgm_audio = new Audio();
var sound_audio = new Audio();

// playscreen
const ProductScreen = (props) => {
  const { gameId } = props.match.params;
  const { sceneId } = props.match.params;
  
  const padding = 0.1;
  const minSize = 300;

  const [ratio, setRatio] = useState(0.5);
  const [windowWidth, setwindowWidth] = useState(window.innerWidth);
  const [windowHeight, setwindowHeight] = useState(window.innerHeight);  
  const userHistory = props.history;
  const dispatch = useDispatch();

  const [i, setI] = useState(0);
  const [Scene, setScene] = useState({});
  const [Dislike, setDislike] = useState(false);
  const [History, setHistory] = useState({});
  const [HistoryMap, setHistoryMap] = useState(false);
  const [Clickable, setClickable] = useState(false);

  useKey("Enter", handleEnter);
  useKey("Space", handleEnter);
  useKey("Digit1", handleChoice);
  useKey("Digit2", handleChoice);
  useKey("Digit3", handleChoice);
  useKey("Digit4", handleChoice);

  function playMusic(i) {
    if (Scene.cutList[i].bgm.music) {
      //이전 곡과 같은 bgm이 아니라면
      if (
        !(i > 0 && Scene.cutList[i - 1].bgm.music == Scene.cutList[i].bgm.music)
      ) {
        bgm_audio.pause();
        bgm_audio.src = Scene.cutList[i].bgm.music;
        bgm_audio.play();
      }
    }
    if (Scene.cutList[i].sound.music) {
      sound_audio.pause();
      sound_audio.src = Scene.cutList[i].sound.music;
      sound_audio.play();
    }
  }

  function handleEnter(event) {
    if (i < Scene.cutList.length - 1 && !Clickable) {
      playMusic(i + 1);
      setI(i + 1);
    }
  }

  function handleChoice(event) {
    if (i === Scene.cutList.length - 1 && !Clickable) {
      if (Scene.nextList[parseInt(event.key) - 1]) {
        userHistory.push(
          `/gameplay/${gameId}/${
            Scene.nextList[parseInt(event.key) - 1].sceneId
          }`
        );
      } else {
        setClickable(true);
        if (parseInt(event.key) - 1 === Scene.nextList.length) {
          event.preventDefault();
          var choice = document.getElementById("choice");
          choice.click();
        }
      }
    }
  }

  useEffect(() => {
    Axios.get(`/api/game/getnextscene/${gameId}/${sceneId}`).then(
      (response) => {
        if (response.data.success) {
          const history = {
            gameId: gameId,
            sceneId: response.data.sceneIdList,
          };
          setHistory(history);
          setI(0);
          setScene(response.data.scene);
          dispatch(gameLoadingPage(0));
          dispatch(gameLoadingPage(1));
        } else {
          message.error("Scene 정보가 없습니다.");
        }
      }
    );
    
    const variable = { gameId: gameId };
    Axios.post("/api/game/ratio", variable).then((response) => {
        if (response.data.success) {
            if (response.data.ratio) {
                setRatio(parseFloat(response.data.ratio));
            } else {
                message.error("배경화면의 비율 정보가 존재하지 않습니다. 2:1로 초기화 합니다.");
            }
        } else {
            message.error("Scene 정보가 없습니다.");
        }
    });
  }, [sceneId]);

  useEffect(() => {
    function handleResize() {
      setwindowWidth(window.innerWidth);
      setwindowHeight(window.innerHeight);
    //   console.log(windowWidth,windowHeight,'/',window.innerWidth,window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
  });
  
  let newScreenSize;
  if ( windowWidth * ratio > windowHeight  ) {
      newScreenSize = {
      width:`${windowHeight * (1-2*padding) / ratio}px`,
      height:`${windowHeight * (1-2*padding)}px`,
      minWidth: `${minSize / ratio}px`,
      minHeight: `${minSize}px`
      }
  } else {
      newScreenSize = {
      width:`${windowWidth * (1-2*padding)}px`,
      height:`${windowWidth * (1-2*padding) * ratio}px`,
      minWidth: `${minSize}px`,
      minHeight: `${minSize * ratio}px`
      }
  }
  dispatch(navbarControl(false));

  if (Scene.cutList) {
    if (i == 0) playMusic(0);
    return (
      <div>
        <div>
          <div
            className="backgroundImg_container"
            style={newScreenSize}
            onClick={(event) => handleEnter(event)}
          >
            <LoadingPage />  
            {Scene.cutList[i].background ? 
            <img
              className="backgroundImg"
              src={Scene.cutList[i].background}
              alt="Network Error"
            /> 
            :
            <div></div>
            }
            <CharacterBlock
              characterList={Scene.cutList[i].characterList}
            />

            {i === Scene.cutList.length - 1 ? (
              <TextBlockChoice
                game_id={gameId}
                cut_name={Scene.cutList[i].name}
                cut_script={Scene.cutList[i].script}
                scene_depth={Scene.depth}
                scene_id={Scene._id}
                scene_next_list={Scene.nextList}
                setClickable={setClickable}
              />
            ) : (
              <TextBlock
                cut_name={Scene.cutList[i].name}
                cut_script={Scene.cutList[i].script}
              />
            )}
            <HistoryMapPopup
              userhistory={userHistory}
              history={History}
              trigger={HistoryMap}
              setTrigger={setHistoryMap}
              setClickable={setClickable}
            />
          </div>
        </div>
        <div className="gamePlay__btn_container">
            <button
                className="gamePlay__complaint_btn" 
                onClick={() => setDislike(state => !state)}>
                신고
            </button>
            <button
                className="gamePlay__historyMap_btn"
                onClick={() => setHistoryMap(state => !state)}
            >
                미니맵
            </button>
        </div>
        <DislikePopup 
            sceneId={sceneId}
            gameId={gameId}
            trigger={Dislike} 
            setTrigger={setDislike} />
      </div>
    );
  } else {
    return <div>now loading..</div>;
  }
};

export default ProductScreen;
