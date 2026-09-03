from typing import Any


class GraphService:
    @staticmethod
    def generate_stix_graph(indicators: list[dict[str, Any]], infrastructure: dict[str, Any], campaign_flag: bool, relay_route: list[dict[str, Any]] = None, attachments: list[dict[str, Any]] = None) -> dict[str, Any]:
        nodes = [{"id": "email-1", "type": "observable-email", "data": {"label": "Suspicious Email"}}]
        edges = []
        
        if infrastructure and infrastructure.get("ip"):
            ip_node_id = f"ip-{infrastructure['ip']}"
            nodes.append({
                "id": ip_node_id,
                "type": "observable-ip",
                "data": {"label": infrastructure["ip"], "asn": infrastructure.get("asn")}
            })
            edges.append({"id": f"e-email-{ip_node_id}", "source": "email-1", "target": ip_node_id})

        # Add Relay Route Nodes (MTA Hops)
        if relay_route:
            prev_node_id = "email-1"
            for hop in relay_route:
                hop_num = hop.get("hop_number")
                ip = hop.get("ip_address")
                
                if ip:
                    ip_node_id = f"hop-ip-{hop_num}-{ip}"
                    nodes.append({
                        "id": ip_node_id,
                        "type": "observable-ipv4-addr",
                        "data": {"label": f"MTA {hop_num}: {ip}"}
                    })
                    edges.append({
                        "id": f"e-route-{prev_node_id}-{ip_node_id}",
                        "source": ip_node_id, # Email came from this IP to the previous entity (reverse chronology visually)
                        "target": prev_node_id,
                        "label": f"Hop {hop_num}"
                    })
                    prev_node_id = ip_node_id
                    
                    # Add Location node if GeoIP succeeded
                    country = hop.get("country")
                    if country:
                        loc_node_id = f"loc-{hop_num}-{country}"
                        # Ensure we don't duplicate location nodes
                        if not any(n["id"] == loc_node_id for n in nodes):
                            nodes.append({
                                "id": loc_node_id,
                                "type": "observable-location",
                                "data": {"label": f"{hop.get('city', 'Unknown')}, {country}"}
                            })
                        edges.append({
                            "id": f"e-loc-{ip_node_id}-{loc_node_id}",
                            "source": ip_node_id,
                            "target": loc_node_id,
                            "label": "located-at"
                        })

        for idx, ind in enumerate(indicators):
            ind_type = ind.get("type", "").lower()
            ind_val = ind.get("value", "")
            node_id = f"ind-{idx}"
            
            node_type = "indicator"
            if "ip" in ind_type: node_type = "observable-ip"
            elif "url" in ind_type: node_type = "indicator-url"
            elif "domain" in ind_type: node_type = "observable-domain"
            
            if ind.get("reputation", {}).get("is_flagged", False):
                if "-" in node_type:
                    parts = node_type.split("-", 1)
                    node_type = f"{parts[0]}-malicious-{parts[1]}"
                else:
                    node_type = f"{node_type}-malicious"
                
            nodes.append({"id": node_id, "type": node_type, "data": {"label": ind_val}})
            edges.append({"id": f"e-email-{node_id}", "source": "email-1", "target": node_id})
            
        if campaign_flag:
            campaign_id = "campaign-1"
            nodes.append({"id": campaign_id, "type": "campaign-cluster", "data": {"label": "Coordinated Campaign"}})
            edges.append({"id": f"e-{campaign_id}-email", "source": campaign_id, "target": "email-1"})
            
        if attachments:
            for i, att in enumerate(attachments):
                file_id = f"file-{att.get('sha256', i)}"
                # If malicious, use a malicious node type if you have one, or just observable-file
                node_type = "observable-file-malicious" if att.get("is_suspicious") else "observable-file"
                nodes.append({
                    "id": file_id,
                    "type": node_type,
                    "data": {"label": att.get("filename", "Unknown File")}
                })
                edges.append({
                    "id": f"e-email-{file_id}",
                    "source": "email-1",
                    "target": file_id,
                    "label": "contains"
                })
            
        return {"nodes": nodes, "edges": edges}
