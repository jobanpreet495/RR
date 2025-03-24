import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  Card,
  message,
  Typography,
  Tag,
  Drawer,
  List,
  Avatar,
  Progress,
  Tabs,
  Upload,
} from "antd";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Briefcase, Lightbulb, MapPin } from "lucide-react";

const { Text, Title } = Typography;

interface ViewResumesProps {
  apiToken: () => Promise<string | null>;
  personDetailsUrl: string;
  defaultCollection: string[];
  username: string;
  setLoading: any;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
}

interface Person {
  contact_info: ContactInfo;
  relevance_score: number;
  current_position: string;
  relevant_skills: string[];
  experience_years: string;
  strengths: string[];
  improvements?: string[];
  metadata?: {
    filename: string;
    timestamp: string;
  };
  downloadLink?: string | null;
  rawData?: any;
}

interface PersonResult {
  person: string;
  filename?: string;
  details?: {
    response_content?: any;
    answer?: any;
    sources?: any[];
    success?: boolean;
    explanation?: string;
  };
}

interface APIResponse {
  multiple_people_results: PersonResult[];
  success: boolean;
}

interface SkillWeight {
  skill: string;
  weight: number;
}

interface Resume {
  category: string;
  document: string;
  filename: string;
  summary: string;
  type: string;
  username: string;
}

// Define response content type
interface ResponseContent {
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  relevance_score?: number;
  current_position?: string;
  relevant_skills?: string[];
  experience_years?: string | number;
  strengths?: string[];
  improvements?: string[];
}

const ViewResumes: React.FC<ViewResumesProps> = ({
  apiToken,
  personDetailsUrl,
  defaultCollection,
  username,
  setLoading,
  apiEndpoints,
}) => {
  const [data, setData] = useState<APIResponse | null>(null);
  const [numResults] = useState(3);
  const [similarityThreshold] = useState(0.7);
  const [selectedCandidate, setSelectedCandidate] = useState<Person | null>(
    null
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [fileLoading, setFileLoading] = useState(false);

  const [formInputs, setFormInputs] = useState({
    role: "",
    additional_info: "",
  });

  const constructSearchPrompt = () => {
    let finalPrompt = "Find me a: " + formInputs.role.trim();

    // Add optional criteria to the prompt if it exists
    if (formInputs.additional_info.trim()) {
      finalPrompt += `. Additionally, ensure the candidate meets these minimum requirements: ${formInputs.additional_info.trim()}. If these requirements are not met, do not include the candidate in the results. If a candidate doesnt have a realistic alphabetic name, exclude them.`;
    }

    return finalPrompt;
  };

  const handleSearch = async () => {
    if (!formInputs.role.trim()) {
      message.warning("Please enter a Job role.");
      return;
    }

    setLoading(true);
    try {
      const token = await apiToken();

      const payload = {
        search_prompt: constructSearchPrompt(),
        collection_name: ["resumes"],
        similarity_threshold: Number(similarityThreshold),
        num_results: Number(numResults),
        username: username,
      };

      const response = await fetch("/person_details", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (response.ok) {
        let counter = 0;

        const resData = (
          JSON.parse(responseText) || {}
        )?.multiple_people_results?.map((ele) => ({
          ...ele,
          details: { ...ele.details, id: `${Date.now()}${counter++}` },
        }));
        console.log(resData);
        setData([...resData]);

        setSelectedResume(resData?.[0]?.details);
        setSelectedCandidate(null);
      } else {
        console.error("Search failed:", response.status, response.statusText);
        console.error("Error details:", responseText);
        message.error(
          `Failed to fetch resume analysis: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      message.error("Error analyzing resume");
    }

    setLoading(false);
  };

  // Function to display candidate details in the drawer
  const showCandidateDetails = (result: PersonResult) => {
    console.log("Showing candidate data:", result);

    // Extract the response content from the nested structure
    let responseContent: ResponseContent = {};

    try {
      if (result.details?.response_content) {
        responseContent = result.details.response_content;
      } else if (result.details?.answer) {
        if (typeof result.details.answer === "string") {
          try {
            const parsed = JSON.parse(result.details.answer);
            responseContent = parsed.response_content || parsed;
          } catch (e) {
            console.error("Error parsing answer as JSON:", e);
          }
        } else {
          responseContent =
            result.details.answer.response_content || result.details.answer;
        }
      }
    } catch (e) {
      console.error("Error accessing response content:", e);
    }

    // Create a person object with the correctly nested data
    const person: Person = {
      contact_info: {
        name: responseContent?.contact_info?.name || result.person || "N/A",
        email: responseContent?.contact_info?.email || "N/A",
        phone: responseContent?.contact_info?.phone || "N/A",
        linkedin: responseContent?.contact_info?.linkedin || "N/A",
      },
      relevance_score: responseContent?.relevance_score || 0,
      current_position: responseContent?.current_position || "Not specified",
      relevant_skills: Array.isArray(responseContent?.relevant_skills)
        ? responseContent.relevant_skills
        : [],
      experience_years:
        responseContent?.experience_years !== undefined
          ? String(responseContent.experience_years)
          : "Not specified",
      strengths: Array.isArray(responseContent?.strengths)
        ? responseContent.strengths
        : [],
      improvements: Array.isArray(responseContent?.improvements)
        ? responseContent.improvements
        : [],
      metadata: {
        filename: result.filename || "Unknown",
        timestamp: "Unknown",
      },
      rawData: result,
    };

    // Update the renderCandidateDetails function to display the raw experience value
    setSelectedCandidate(person);
    setDrawerVisible(true);
  };

  // Update the renderCandidateDetails function to display the raw experience value
  const renderCandidateDetails = () => {
    if (!selectedCandidate) return null;

    // Try to extract experience directly from raw data
    let experienceValue = selectedCandidate.experience_years;
    try {
      if (
        selectedCandidate.rawData?.details?.response_content?.experience_years
      ) {
        experienceValue =
          selectedCandidate.rawData.details.response_content.experience_years;
      }
    } catch (e) {
      console.error("Error extracting experience:", e);
    }

    return (
      <>
        <Title level={4}>Contact Information</Title>
        <div style={{ marginBottom: "20px" }}>
          <Text strong>Name: </Text>
          <Text>{selectedCandidate.contact_info?.name || "N/A"}</Text>
          <br />
          <Text strong>Phone: </Text>
          <Text>{selectedCandidate.contact_info?.phone || "N/A"}</Text>
          <br />
          <Text strong>Email: </Text>
          <Text>{selectedCandidate.contact_info?.email || "N/A"}</Text>
          <br />
          <Text strong>LinkedIn: </Text>
          {selectedCandidate.contact_info?.linkedin &&
          selectedCandidate.contact_info.linkedin !== "N/A" ? (
            <a
              href={selectedCandidate.contact_info.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedCandidate.contact_info.linkedin}
            </a>
          ) : (
            "N/A"
          )}
        </div>

        <Title level={4}>Current Position</Title>
        <div style={{ marginBottom: "20px" }}>
          <Text>{selectedCandidate.current_position || "Not specified"}</Text>
        </div>

        <Title level={4}>Experience</Title>
        <div style={{ marginBottom: "20px" }}>
          <Text>{experienceValue || "Not specified"}</Text>
        </div>

        <Title level={4}>Relevant Skills</Title>
        <div style={{ marginBottom: "20px" }}>
          {selectedCandidate.relevant_skills &&
          selectedCandidate.relevant_skills.length > 0 ? (
            selectedCandidate.relevant_skills.map((skill, idx) => (
              <Tag key={idx} color="blue" style={{ margin: "4px" }}>
                {skill}
              </Tag>
            ))
          ) : (
            <Text>No skills listed</Text>
          )}
        </div>

        <Title level={4}>Strengths</Title>
        <div style={{ marginBottom: "20px" }}>
          {selectedCandidate.strengths &&
          selectedCandidate.strengths.length > 0 ? (
            <ul>
              {selectedCandidate.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          ) : (
            <Text>No strengths listed</Text>
          )}
        </div>

        {selectedCandidate.improvements &&
          selectedCandidate.improvements.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <Title level={4}>Areas for Improvement</Title>
              <ul>
                {selectedCandidate.improvements.map((improvement, idx) => (
                  <li key={idx}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

        {selectedCandidate.metadata && (
          <div style={{ marginTop: "20px" }}>
            <Text type="secondary">
              File: {selectedCandidate.metadata.filename} | Uploaded:{" "}
              {selectedCandidate.metadata.timestamp}
            </Text>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">
            Raw Response Data (Debug)
          </h3>
          <div
            className="border rounded-md p-4 bg-gray-50"
            style={{ height: "400px" }}
          >
            {selectedResume &&
              (() => {
                const pdfData = findPdfDocument(selectedResume);
                if (pdfData) {
                  return (
                    <iframe
                      src={createPdfBlobUrl(pdfData) || ""}
                      className="w-full h-full border-0"
                      title="PDF Debug View"
                    ></iframe>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No PDF document available</p>
                    </div>
                  );
                }
              })()}
          </div>
        </div>
      </>
    );
  };

  // Add this function that directly extracts the match percentage from the display text
  const extractMatchPercentage = (resume: any): number => {
    // Look for the match text in various format patterns
    const matchText =
      resume.match ||
      (typeof resume.details?.match === "string" ? resume.details.match : "") ||
      resume.match_percentage ||
      (typeof resume.details?.match_percentage === "string"
        ? resume.details.match_percentage
        : "");

    // Extract the numeric part using regex
    const percentageMatch = String(matchText).match(/(\d+(\.\d+)?)%?/);
    return percentageMatch ? parseFloat(percentageMatch[1]) : 0;
  };

  // Update the sort function to respect the sort direction
  const sortResumesByMatch = () => {
    const sortedResumes = [...resumes].sort((a, b) => {
      const percentA = extractMatchPercentage(a);
      const percentB = extractMatchPercentage(b);

      // Apply sort direction
      return sortDirection === "desc"
        ? percentB - percentA // Descending order
        : percentA - percentB; // Ascending order
    });

    setResumes(sortedResumes);
  };

  const closeModal = () => {
    setShowPdfModal(false);
  };

  // Function to create a blob URL from base64 data
  const createPdfBlobUrl = (base64Data: string) => {
    try {
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
      const byteArray = new Uint8Array(byteArrays);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error creating PDF blob URL:", error);
      return null;
    }
  };

  // Function to find the PDF document in various possible locations
  const findPdfDocument = (data: any): string | null => {
    if (!data) return null;

    // Check in details.metadata.documents (the correct path)
    if (data.details?.metadata?.documents)
      return data.details.metadata.documents;

    // Check direct properties
    if (data.document) return data.document;

    // Check in details
    if (data.details?.document) return data.details.document;

    // Other fallback checks
    const possibleBase64Fields = [
      data.pdf_data,
      data.details?.pdf_data,
      data.details?.response_content?.pdf_data,
      data.attachments?.pdf,
    ];

    for (const field of possibleBase64Fields) {
      if (
        field &&
        typeof field === "string" &&
        (field.startsWith("JVBERi") || field.startsWith("JVBER"))
      ) {
        return field;
      }
    }

    return null;
  };

  const handleUpload = async ({ file }) => {
    setFileLoading(true);
    try {
      const token = await apiToken();

      const formData = new FormData();

      formData.append("document", file as File);

      formData.append("username", username);
      formData.append("category", "resumes");

      // Add more detailed logging
      console.log("Full upload URL:", apiEndpoints.UPLOAD);
      console.log("Files to upload:", 1);
      console.log("Username:", username);

      const response = await fetch(apiEndpoints.UPLOAD, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      message.success("Upload completed successfully");

      return data;
    } catch (error) {
      console.error("Upload error full details:", error);
      console.error("API Endpoint:", apiEndpoints.UPLOAD);
      message.error("Upload failed");
    }
    setFileLoading(false);
  };

  console.log(selectedResume);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Advanced Resume Analysis
        </Title>
        <Upload
          beforeUpload={() => false}
          fileList={[]}
          onChange={handleUpload}
          accept=".pdf"
        >
          <Button type="primary" icon={<UploadOutlined />}>
            Upload
          </Button>
        </Upload>
      </div>

      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Input.TextArea
            rows={2}
            placeholder="Job Role"
            value={formInputs?.role || ""}
            onChange={(e) =>
              setFormInputs({ ...formInputs, role: e.target.value })
            }
          />
          <Input.TextArea
            rows={2}
            placeholder="Job description, Skill, Location or more..."
            value={formInputs?.additional_info || ""}
            onChange={(e) =>
              setFormInputs({ ...formInputs, additional_info: e.target.value })
            }
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>
      </Card>
      <br />
      {!!data?.length && (
        <div
          style={{
            display: "flex",
            gap: 14,
            height: "calc(100vh - 300px)",
            overflow: "hidden",
          }}
        >
          <div style={{ width: 400, height: "100%", overflowY: "auto" }}>
            <ResumesList
              data={data || []}
              {...{ setSelectedResume, selectedResume }}
            />
          </div>

          <div style={{ width: "calc(100% - 400px)" }}>
            <Card
              style={{
                height: "100%",
              }}
              styles={{
                body: {
                  padding: 0,
                },
              }}
            >
              <Tabs
                key={selectedResume?.id}
                defaultActiveKey="MATCH_ANALYSIS"
                items={[
                  {
                    key: "MATCH_ANALYSIS",
                    label: (
                      <div style={{ paddingInline: 8 }}>Match Analysis</div>
                    ),
                    children: (
                      <ProfileAnalysis
                        data={selectedResume?.response_content || {}}
                        {...{ formInputs }}
                      />
                    ),
                  },
                  {
                    key: "PROFILE",
                    label: "Profile",
                    children: (
                      <ResumePreview
                        fileUrl={
                          selectedResume?.metadatas?.[
                            selectedResume?.id?.slice(-1)
                          ]?.document
                        }
                        id={selectedResume?.id}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      <Drawer
        title={selectedCandidate?.contact_info?.name || "Candidate Details"}
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {renderCandidateDetails()}
      </Drawer>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume, index) => {
            const person = resume.parsedData;

            return (
              <div
                key={index}
                className="border rounded-md mb-4 p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {person.contact_info.name}
                    </h3>
                    <p className="text-gray-700 font-bold">
                      {person.current_position}
                    </p>

                    {/* Display explanation with proper fallbacks */}
                    {person.explanation && (
                      <p className="text-sm text-gray-600 mt-2 italic border-l-2 border-gray-300 pl-2">
                        {person.explanation}
                      </p>
                    )}

                    {/* Rest of the card */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {/* Skills/tags */}
                    </div>
                  </div>
                  {/* Right side content */}
                </div>
                {/* Rest of card */}
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedResume.filename || "Resume"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-1">
              {selectedResume.document ? (
                <iframe
                  src={createPdfBlobUrl(selectedResume.document) || ""}
                  className="w-full h-full border-0"
                  title="Resume Preview"
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Unable to load PDF preview</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded mr-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewResumes;

const ResumesList = ({
  data = [],
  setSelectedResume,
  selectedResume,
}: {
  data: any;
  setSelectedResume: any;
}) => {
  return (
    <List
      size="small"
      dataSource={data}
      renderItem={(item: any) => {
        const candidateDetails = item.details.response_content;
        const exp = candidateDetails.experience_years
          .replace(/not listed/i, "")
          .replace(/year/, "");

        return (
          <Card
            style={{
              marginBottom: 10,
              cursor: "pointer",
              background:
                selectedResume?.id === item?.details?.id ? "#1677ff0a" : "#fff",
            }}
            bodyStyle={{ padding: "16px" }}
            onClick={() => setSelectedResume(item.details)}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div>
                <Avatar
                  size="large"
                  style={{
                    backgroundColor: "#6B5CFF",
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  {candidateDetails.contact_info.name[0]}
                </Avatar>
              </div>
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Title level={4} style={{ margin: 0, marginRight: "8px" }}>
                    {candidateDetails.contact_info.name}
                  </Title>
                  <div
                    style={{
                      fontSize: 12,
                      background:
                        candidateDetails.relevance_score > 80
                          ? "#86EFAC"
                          : candidateDetails.relevance_score > 50
                          ? "#FDE047"
                          : "#FCA5A5",
                      color:
                        candidateDetails.relevance_score > 80
                          ? "#166534"
                          : candidateDetails.relevance_score > 50
                          ? "#854D0E"
                          : "#991B1B",
                      borderRadius: 4,
                      padding: "2px 4px",
                    }}
                  >
                    {candidateDetails.relevance_score}% match
                  </div>
                </div>
                <p style={{ lineHeight: 1, paddingTop: 4 }}>
                  {candidateDetails.current_position.replace(
                    /not listed/i,
                    "-"
                  )}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    paddingTop: 8,
                  }}
                >
                  {exp && (
                    <>
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Briefcase size={16} />
                        {exp}{" "}
                        {Number(candidateDetails.experience_years) > 1
                          ? "years"
                          : "year"}
                      </p>
                      <p
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "100%",
                          background: "#000",
                        }}
                      />
                    </>
                  )}
                  {candidateDetails.location.toLowerCase() !== "not listed" && (
                    <p
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <MapPin size={16} />
                      {candidateDetails.location}
                    </p>
                  )}
                </div>
                <br />
                <div>
                  <div>
                    <p className="space-between">
                      <span>Technical Match</span>
                      <span>{candidateDetails.technical_match}</span>
                    </p>
                    <Progress
                      percent={Number(
                        candidateDetails.technical_match?.split("%")?.[0]
                      )}
                      strokeColor="#52c41a"
                      size="small"
                      showInfo={false}
                    />
                  </div>
                  <div>
                    <p className="space-between">
                      <span>Experience Match</span>
                      <span>{candidateDetails.experience_match}</span>
                    </p>
                    <Progress
                      percent={Number(
                        candidateDetails.experience_match.split("%")[0]
                      )}
                      strokeColor="#52c41a"
                      size="small"
                      showInfo={false}
                    />
                  </div>
                </div>

                {/* <div>
                        {candidate.skills.slice(0, 5).map((skill) => (
                          <Tag
                            key={skill}
                            color="blue"
                            style={{ marginRight: "4px", marginBottom: "4px" }}
                          >
                            {skill}
                          </Tag>
                        ))}
                        {candidate.skills.length > 5 && (
                          <Tag color="default">
                            +{candidate.skills.length - 5} more
                          </Tag>
                        )}
                      </div> */}
                {/* <div style={{ marginTop: "8px" }}>
                        <Space>
                          <EnvironmentOutlined />{" "}
                          <Text type="secondary">{candidate.location}</Text>
                          <ClockCircleOutlined />{" "}
                          <Text type="secondary">
                            Active {candidate.lastActive}
                          </Text>
                          <Text type="secondary">
                            {formatExperience(candidate.experience)}
                          </Text>
                        </Space>
                      </div> */}
              </div>
            </div>
          </Card>
        );
      }}
    />
  );
};

const ProfileAnalysis = ({
  data,
  formInputs,
}: {
  data: any;
  formInputs: any;
}) => {
  return (
    <div
      style={{
        padding: 14,
        paddingTop: 0,
        height: "calc(100vh - 370px)",
        overflowY: "auto",
      }}
    >
      <Card style={{ background: "#1677ff0a" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div
            style={{
              borderRadius: "100%",
              background: "#1677ff36",
              padding: 5,
              alignSelf: "flex-start",
              minWidth: 30,
              height: 30,
              textAlign: "center",
            }}
          >
            <Lightbulb size={16} style={{ color: "#1677ff" }} />
          </div>
          <div>
            <h4>AI Recommendation</h4>
            <p>
              This {formInputs.role} perfectly matches your requirements because{" "}
              {data.explanation}
            </p>
          </div>
        </div>
      </Card>
      <br />
      <h3>Technical Skills</h3>
      <ul style={{ paddingLeft: 20 }}>
        {data.relevant_skills.map((ele) => (
          <li>{ele}</li>
        ))}
      </ul>
      <br />
      <h3>Key Strengths</h3>
      <ul style={{ paddingLeft: 20 }}>
        {data.strengths.map((ele) => (
          <li>{ele}</li>
        ))}
      </ul>
    </div>
  );
};

const ResumePreview = ({ fileUrl, id }) => {
  console.log(fileUrl);
  return (
    <iframe
      key={id}
      src={`data:application/pdf;base64,${fileUrl}`}
      title="PDF Viewer"
      style={{ width: "100%", height: "calc(100vh - 370px)" }}
    />
  );
};
