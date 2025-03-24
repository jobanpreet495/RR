import React, { useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Button,
  Dropdown,
  Avatar,
  Select,
  Slider,
  Spin,
} from "antd";
import { useMsal } from "@azure/msal-react";
import UploadResume from "./UploadResume.tsx";
import ViewResumes from "./ViewResumes.tsx";
import Candidates from "./Candidates.tsx";
import logo from "../assets/rapid-recruit-logo.png";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// API endpoints configuration
export const API_ENDPOINTS = {
  UPLOAD: "/upload",
  RETRIEVE: "/get_resumes",
  SEARCH: "/person_details",
  SEARCH_MATCHES: "/search_matches",
};

export const MainContent: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [selectedKey, setSelectedKey] = useState("view");
  const [loading, setLoading] = useState(false);
  const userEmail = accounts[0]?.username || "";
  const getToken = async () => "testjwt";

  const handleLogout = () => {
    instance.logoutPopup().catch((e) => {
      console.error(e);
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "2px 6px 12px 0 #0000001a",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <img src={logo} alt="Rapid Recruit" width={200} />
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "LOGOUT",
                label: "Logout",
                icon: <LogoutOutlined />,
              },
            ],
            onClick: handleLogout,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Avatar icon={<UserOutlined />} />
            <span style={{ textTransform: "capitalize" }}>
              {userEmail?.split("@")?.[0]}
            </span>
          </div>
        </Dropdown>
      </Header>
      <Spin spinning={loading}>
        <Layout>
          {/* <Sider
            width={200}
            style={{
              background: "#fff",
              padding: "2em 1em",
              height: "calc(100vh - 64px)",
            }}
          >
            <h2 style={{ margin: 0 }}>Filters</h2>
            <br />
            <div>
              <p>Sort By : </p>
              <Select
                style={{ width: "100%" }}
                options={[
                  {
                    label: (
                      <p>
                        <ArrowUpOutlined /> Relevance
                      </p>
                    ),
                    value: "rel",
                  },
                  {
                    label: (
                      <p>
                        <ArrowDownOutlined /> Relevance
                      </p>
                    ),
                    value: "relD",
                  },
                ]}
              />
            </div>
            <br />
            <div>
              <p>Experience : </p>
              <Slider
                defaultValue={0}
                tooltip={{
                  open: true,
                  formatter: (value) => (value === 10 ? "Any" : value),
                }}
                max={10}
              />
            </div>
          </Sider> */}
          <Content
            style={{
              padding: "24px",
              minHeight: 280,
              width: "90%",
              margin: "auto",
            }}
          >
            <ViewResumes
              apiToken={getToken}
              personDetailsUrl={API_ENDPOINTS.SEARCH}
              defaultCollection={["resumes"]}
              username={userEmail}
              apiEndpoints={API_ENDPOINTS}
              {...{ setLoading }}
            />
            {/* {selectedKey === "upload" ? (
            <UploadResume
              apiToken={getToken}
              apiEndpoints={API_ENDPOINTS}
              username={userEmail}
            />
          ) : selectedKey === "view" ? (
            <ViewResumes
              apiToken={getToken}
              personDetailsUrl={API_ENDPOINTS.SEARCH}
              defaultCollection={["resumes"]}
              username={userEmail}
            />
          ) : (
            <Candidates
              apiToken={getToken}
              personDetailsUrl={API_ENDPOINTS.SEARCH_MATCHES}
              defaultCollection={["resumes"]}
              username={userEmail}
            />
          )} */}
          </Content>
        </Layout>
      </Spin>
    </Layout>
  );
};
