import "./styles.css";
import axios from "axios";
import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button } from "@mui/material";

export default function App() {
  const [enquiryId, setEnquiryId] = useState(null);
  const [uwme, setUWME] = useState(null);
  const [autoOptions, setAutoOptions] = useState({});

  const showSections = (sections) => {
    return (
      sections &&
      sections.map((s, i) => (
        <Accordion key={i}>
          <AccordionSummary
            style={{ "background-color": s.isSatisfied ? "green" : "gray" }}
            expandIcon={<ExpandMoreIcon />}
          >
            <Typography>
              {s.name} : {s.isSatisfied ? "DONE" : "OPEN"}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {showEnquiryLines(s.enquiryLines)}
          </AccordionDetails>
        </Accordion>
      ))
    );
  };

  const showEnquiryLines = (el) => {
    return el.map((e) => showEnquiryLine(e.questions));
    //showEnquiryLine(el[0].questions);
  };
  const showEnquiryLine = (lines) => {
    //console.log({ data: lines.map((x) => x.definition) });

    return lines.map((line, i) => (
      <div className="question" key={i}>
        {showOptions(
          line.definition.name,
          line.definition.options,
          line.definition.text,
          line.definition.type,
          line.definition.optionListName,
          line.isSatisfied,
          line
        )}

        {line.validationErrors[line.answers[0]] ? (
          <Alert severity="error">
            {line.validationErrors[line.answers[0]]}
          </Alert>
        ) : (
          ""
        )}
      </div>
    ));
  };
  const update = async (event) => {
    const key = event.target.name;
    const value = event.target.value;

    let body = { answers: {} };
    body["answers"][key] = value;
    updateAnswer(body);
  };

  async function updateAnswer(body) {
    const url = `https://uat-apps.fwd.com.ph/UWWSSIT/postEnquiry/${enquiryId}`;

    const data = await axios.post(url, body);
    setUWME(data.data);
  }

  const updateText = (event) => {
    if (event.key === "Enter") {
      update(event);
    }
  };

  function getOptionListBack(id, name, listName, object) {
    if (!autoOptions[listName]) {
      const url = `https://uat-apps.fwd.com.ph/UWWSSIT/optionList/FWD_PHP/20230425_v1/${listName}/`;

      axios.get(url).then((x) => {
        autoOptions[listName] = x.data.options;
        console.log(autoOptions[listName]);
        setAutoOptions(autoOptions);
      });
    }
    return (
      <Autocomplete
        name={id}
        freeSolo
        options={
          autoOptions[listName] ? autoOptions[listName].map((x) => x.name) : []
        }
        onChange={(event, newValue) => {
          let body = { answers: {} };
          body["answers"][id] = newValue;

          updateAnswer(body);
          //console.log({ newValue });
        }}
        onInputChange={(event, newInputValue) => {}}
        renderInput={(params) => <TextField {...params} label={name} />}
      />
    );
  }

  function clearAnswer(name) {
    let body = { answers: {} };
    body["answers"][name] = "";
    updateAnswer(body);

    console.log({ body });
  }

  const showOptions = (
    id,
    options,
    name,
    type,
    listName,
    isReadonly,
    object
  ) => {
    if (isReadonly) {
      return (
        <>
          {name}: <b>{object.answers[0]}</b>{" "}
          <Button
            onClick={() => {
              clearAnswer(id);
            }}
          >
            Clear
          </Button>
        </>
      );
    } else {
      switch (type) {
        case "NUMBER":
          return (
            <TextField
              name={id}
              onKeyPress={updateText}
              label={name}
              fullWidth
              defaultValue={object.answers[0]}
            ></TextField>
          );

        case "PAST_DATE":
          return (
            <>
              <TextField
                name={id}
                onKeyPress={updateText}
                label={name}
                fullWidth
                defaultValue={object.answers[0]}
              ></TextField>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker />
              </LocalizationProvider>
            </>
          );
        case "STRING":
          return (
            <TextField
              name={id}
              onKeyPress={updateText}
              label={name}
              fullWidth
              defaultValue={object.answers[0]}
            ></TextField>
          );
        case "OPTION_GROUP":
          return (
            <>
              <FormControl variant="standard" fullWidth>
                <InputLabel id={"label-" + id}>{name}</InputLabel>
                <Select
                  name={id}
                  onChange={update}
                  labelId={"label-" + id}
                  fullWidth
                  defaultValue={object.answers[0]}
                >
                  <MenuItem>--please select--</MenuItem>
                  {options.map((o, i) => (
                    <MenuItem key={i} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          );

        case "OPTION_BACKED":
          return getOptionListBack(id, name, listName, object);

        default:
          break;
      }
    }
  };

  const showAnswers = (ans) => {
    console.log({ uwme });
    let a = "";
    for (const property in ans) {
      if (ans[property] !== "") a += `${property}:${ans[property]}\n`;
    }
    return a;
  };

  const init = async () => {
    const data = await axios(
      "https://uat-apps.fwd.com.ph/UWWSSIT/startEnquiry?locale=English"
    );
    setEnquiryId(data.data.enquiryId);
    setUWME(data.data);
  };
  useEffect(() => {
    init();
  }, []);
  useEffect(() => {
    if (enquiryId) {
      const initData = {
        answers: {
          DE_DUP_IND: "With client ID",
          ROLE_IND: "Life Assured",
          NATIONALITY: "HK",
        },
      };
      updateAnswer(initData);
    }
  }, [enquiryId]);

  return (
    <div className="App">
      <div id="left">
        <h2>
          Questions : {uwme && uwme.isSatisfied ? "can close" : "unfinished"}
        </h2>

        {uwme && showSections(uwme.sections)}
      </div>
      <div id="right">
        <h2>Answers</h2>
        <pre>{uwme && uwme.allAnswers && showAnswers(uwme.allAnswers)}</pre>
      </div>
    </div>
  );
}
