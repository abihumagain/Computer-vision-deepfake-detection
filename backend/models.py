import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models


def _normalize_state_dict_keys(state_dict: dict, expect_prefix: str) -> dict:
    """Normalize checkpoint keys to match the target model namespace.

    Supports loading checkpoints saved from:
    - wrapped models (keys like 'model.conv1.weight')
    - plain torchvision models (keys like 'conv1.weight')
    """
    if not state_dict:
        return state_dict

    keys = list(state_dict.keys())
    has_prefix = all(k.startswith(expect_prefix) for k in keys)

    # Target expects prefixed keys; add prefix when absent.
    if expect_prefix and not has_prefix:
        return {f"{expect_prefix}{k}": v for k, v in state_dict.items()}

    # Target expects unprefixed keys; strip prefix when present.
    if not expect_prefix and any(k.startswith("model.") for k in keys):
        return {k.removeprefix("model."): v for k, v in state_dict.items()}

    return state_dict


class BaselineCNN(nn.Module):
    """Baseline CNN exactly matching the training notebook architecture."""

    def __init__(self):
        super(BaselineCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 32 * 32, 128)
        self.fc2 = nn.Linear(128, 2)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x


class ImprovedCNN(nn.Module):
    """Improved CNN exactly matching the training notebook architecture."""

    def __init__(self):
        super(ImprovedCNN, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        self.fc1 = nn.Linear(128 * 16 * 16, 256)
        self.fc2 = nn.Linear(256, 2)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(x.size(0), -1)
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.fc2(x)
        return x


class ResNet18Classifier(nn.Module):
    """Fine-tuned ResNet18 matching the training notebook head."""

    def __init__(self, num_classes=2):
        super(ResNet18Classifier, self).__init__()
        base = models.resnet18(weights=None)
        in_features = base.fc.in_features
        base.fc = nn.Linear(in_features, num_classes)
        self.model = base

    def forward(self, x):
        return self.model(x)


def load_model(model_name: str, model_path: str, device: torch.device):
    """Instantiate and load weights for the given model name."""
    name = model_name.lower()
    if name == "baseline":
        model = BaselineCNN()
    elif name == "improved":
        model = ImprovedCNN()
    elif name == "resnet18":
        model = ResNet18Classifier()
    else:
        raise ValueError(f"Unknown model: {model_name}")

    state = torch.load(model_path, map_location=device)
    # Support both raw state_dict and checkpoint dicts
    if isinstance(state, dict) and "model_state_dict" in state:
        state = state["model_state_dict"]
    elif isinstance(state, dict) and "state_dict" in state:
        state = state["state_dict"]

    # Align key namespace between checkpoint and current model definition.
    # ResNet18 wrapper stores params under `model.*` while some checkpoints are plain `*`.
    expect_prefix = "model." if name == "resnet18" else ""
    state = _normalize_state_dict_keys(state, expect_prefix=expect_prefix)

    # strict=True catches architecture mismatches early instead of silently using partial/random weights.
    model.load_state_dict(state, strict=True)
    model.to(device)
    model.eval()
    return model
