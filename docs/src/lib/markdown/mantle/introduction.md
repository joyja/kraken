# Introduction

Mantle is a data aggregator and historian for MQTT Sparkplug B data. It listens for data in the sparkplug B namespace, historizes all packets coming in to TimescaleDB and provides a GraphQL API for accessing both real time and historical data. It provides Server Sent Events (SSE) subscription data to allow for real time data streaming. 

Mantle also has advanced alarm and roster function engines that allow industrial system integrators complete control over stake holder notifications with an emphasis on assuring users are not bombarded with meaningless alerts.