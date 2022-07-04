import dedent from "dedent";
import { BehaviorSubject, EMPTY, filter, map, Subject } from "rxjs";

import { Command } from "./command";
import { makeKey } from "./key";
import { keyMap } from "./key-map";
import { makeModel } from "./model";
import parse from "./parse";
import { makeView } from "./view";
import init from "./example-init-outline";
import { mode as makeMode, Mode } from "./mode";

const command = new Subject<Command>();
const line = new Subject<string>();

line
  .pipe(
    map(
      (payload) =>
        ({ command: "update selected node body", payload } as Command)
    )
  )
  .subscribe(command);

const { model } = makeModel({
  initWith: new BehaviorSubject(parse(init)),
  command,
  mode: () => mode.get(),
});

const modeSubject = new Subject<Mode>();

makeView({
  input: process.stdin,
  output: process.stdout,
  model,
  mode: modeSubject.asObservable(),
  line,
});

const { key } = makeKey({
  input: process.stdin,
  mode: modeSubject.asObservable(),
});

const mode = makeMode({ key, line });

mode.mode.subscribe(modeSubject);

key.pipe(map(keyMap)).subscribe(command);

command
  .pipe(filter(({ command }) => command == "quit"))
  .subscribe(() => process.exit());
