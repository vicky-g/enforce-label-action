import * as core from '@actions/core';
import * as github from '@actions/github';

import axios from 'axios'

async function run() {
  try {
    console.log(`github.context: ${JSON.stringify(github.context)}`);
    const labels = github.context!.payload!.pull_request!.labels;

    await enforceAnyLabels(labels);
    enforceAllLabels(labels);
    enforceBannedLabels(labels);

  } catch (error) {
    core.setFailed(error.message);
  }
}

async function enforceAnyLabels(labels) {
  const requiredLabelsAny: string[] = await getLabelsFromGH() //getInputArray('REQUIRED_LABELS_ANY');
  if (requiredLabelsAny.length > 0 && !requiredLabelsAny.some(requiredLabel => labels.find((l) => l.name === requiredLabel))) {
    const requiredLabelsAnyDescription = getInputString('REQUIRED_LABELS_ANY_DESCRIPTION', `Please select one of the required labels for this PR: ${requiredLabelsAny}`);
    core.setFailed(requiredLabelsAnyDescription);
  }
}

function enforceAllLabels(labels) {
  const requiredLabelsAll = getInputArray('REQUIRED_LABELS_ALL');
  if (!requiredLabelsAll.every(requiredLabel => labels.find(l => l.name === requiredLabel))) {
    const requiredLabelsAllDescription = getInputString('REQUIRED_LABELS_ALL_DESCRIPTION', `All labels are required for this PR: ${requiredLabelsAll}`);
    core.setFailed(requiredLabelsAllDescription);
  }
}

function enforceBannedLabels(labels) {
  const bannedLabels = getInputArray('BANNED_LABELS');
  let bannedLabel;
    if (bannedLabels && (bannedLabel = labels.find(l => bannedLabels.includes(l.name)))) {
      const bannedLabelsDescription = getInputString('BANNED_LABELS_DESCRIPTION', `${bannedLabel.name} label is banned`);
      core.setFailed(bannedLabelsDescription);
    }
}

function getInputArray(name): string[] {
  const rawInput = core.getInput(name, {required: false});
  return rawInput !== '' ? rawInput.split(',') : [];
}

function getInputString(name, defaultValue): string {
  const rawInput = core.getInput(name, {required: false});
  return rawInput !== '' ? rawInput : defaultValue;
}

async function getLabelsFromGH(): Promise<string[]> {
  const resp = await axios.get(
    'https://api.github.com/repos/AudiusProject/audius-protocol/labels'
  )

  return resp.data.map(label => label.name)
}

run();
