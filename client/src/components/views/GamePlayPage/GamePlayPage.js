import "./GamePlayPage.css";
import CharacterBlock from "./CharacterBlock";
import { TextBlock, TextBlockChoice } from "./TextBlock.js";
import React, { useEffect, useRef, useState } from "react";
import Axios from "axios";
import DislikePopup from "./Dislike";
import HistoryMapPopup from "./HistoryMap";
import LoadingPage from "./LoadingPage";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { gameLoadingPage } from "../../../_actions/gamePlay_actions";
import { navbarControl } from "../../../_actions/controlPage_actions";

var bgm_audio = new Audio();
var sound_audio = new Audio();

// Use keyboard input
function useKey(key, cb) {
  const callbackRef = useRef(cb);

  useEffect(() => {
    callbackRef.current = cb;
  });

  useEffect(() => {
    function handle(event) {
      if (event.code === key) {
        callbackRef.current(event);
      }
    }
    document.addEventListener("keypress", handle);
    return () => document.removeEventListener("keypress", handle);
  }, [key]);
}

// playscreen
const ProductScreen = (props) => {
  const { gameId } = props.match.params;
  const { sceneId } = props.match.params;
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

  function handleEnter() {
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
          //   event.preventDefault();
          var choice = document.getElementById("choice");
          choice.click();
          //   event.preventDefault();
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
  }, [sceneId]);

  dispatch(navbarControl(false));

  if (Scene.cutList) {
    if (i == 0) playMusic(0);
    return (
      <div>
        <div className="productscreen">
          <div
            className="background_img_container"
            onClick={() => handleEnter()}
          >
            <button
              className="HistoryMap_btn"
              onClick={() => setHistoryMap(true)}
            >
              미니맵
            </button>
            <LoadingPage />
            <img
              className="background_img"
              src={Scene.cutList[i].background}
              alt="Network Error"
            />
            <CharacterBlock
              characterCnt={Scene.cutList[i].characterCnt}
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
        <button onClick={() => setDislike(true)}>신고</button>

        <DislikePopup trigger={Dislike} setTrigger={setDislike} />
      </div>
    );
  } else {
    return <div>now loading..</div>;
  }
};

export default ProductScreen;
