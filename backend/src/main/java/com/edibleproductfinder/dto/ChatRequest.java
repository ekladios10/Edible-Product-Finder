package com.edibleproductfinder.dto;

import java.util.List;

public record ChatRequest(List<ChatMessage> messages) {}